const {adminModel} = require("../models/users/admin");
const auditLogModel = require("../models/users/adminAuditLog");
const productModel = require("../models/product");

const ActivationFactory = (activableModels) => {
  const activation = async (req, res) => {
    try {
      const { entity, id } = req.params;
      const { activate } = req.query;

      // Check if entity exists in activableModels
      if (!activableModels[entity]) {
        return res.status(400).json({
          success: false,
          message: `Entity '${entity}' is not activable`,
          availableEntities: Object.keys(activableModels),
        });
      }

      // Get entity configuration
      const { model, modelName, allowedRoles, requiredPermission } =
        activableModels[entity];

      // Check role-based access (from checkAuth middleware)
      const userRole = req.user?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. ${allowedRoles.join(", ")} only`,
          yourRole: userRole || "unknown",
        });
      }

      // Validate activate query parameter
      if (activate === undefined) {
        return res.status(400).json({
          success: false,
          message: "activate query parameter is required",
          example: `PATCH /${entity}/${id}/activation?activate=true`,
        });
      }

      if (activate !== "true" && activate !== "false") {
        return res.status(400).json({
          success: false,
          message: "activate must be 'true' or 'false'",
          received: activate,
        });
      }

      const activateStatus = activate === "true";
      const action = activateStatus ? "activate" : "deactivate";

      // Find the target entity
      const targetEntity = await model.findById(id);
      if (!targetEntity) {
        return res.status(404).json({
          success: false,
          message: `${modelName} not found`,
          id: id,
        });
      }

      // Prevent self activation/deactivation for all user types
      const userEntities = ["admin", "store_owner", "client"];
      if (userEntities.includes(targetEntity.role) && req.user.id === id) {
        return res.status(403).json({
          success: false,
          message: `You cannot ${action} your own account`,
          entity: targetEntity.role,
        });
      }

      // ============= PERMISSION-BASED VALIDATIONS FOR ALL ENTITIES =============

      // For admin role, check specific permissions for BOTH activation AND deactivation
      if (userRole === "admin") {
        // Get the requesting admin's permissions
        const requestingAdmin = await adminModel.findById(req.user.id);

        if (!requestingAdmin) {
          return res.status(403).json({
            success: false,
            message: "Admin permissions not found",
          });
        }

        // Determine required permission based on entity type
        let requiredPermissionKey = "";
        let entityTypeForAudit = "";

        switch (entity) {
          case "clients":
            requiredPermissionKey = "manageUsers";
            entityTypeForAudit = "client";
            break;
          case "store_owners":
            requiredPermissionKey = "manageStores";
            entityTypeForAudit = "store_owner";
            break;
          case "categories":
            requiredPermissionKey = "manageCategories";
            entityTypeForAudit = "category";
            break;
          // case "reviews":
          //     requiredPermissionKey = "manageUsers";
          //     entityTypeForAudit = "client";
          //     break;
          // case "products":
          //     requiredPermissionKey = "manageProducts";
          //     entityTypeForAudit = "product";
          //     break;
          case "admins":
            requiredPermissionKey = "manageAdmins";
            entityTypeForAudit = "admin";
            break;
          default:
            requiredPermissionKey = requiredPermission || "";
        }

        // Check if admin has the required permission (for BOTH activation AND deactivation)
        if (
          requiredPermissionKey &&
          !requestingAdmin.permission?.includes(requiredPermissionKey)
        ) {
          return res.status(403).json({
            success: false,
            message: `Permission denied. You need the '${requiredPermissionKey}' permission to ${action} ${entity}`,
            requiredPermission: requiredPermissionKey,
            yourPermissions: requestingAdmin.permission || [],
          });
        }

        // Special validation for admin entities (creation hierarchy check)
        if (targetEntity.role === "admin" || entity === "admins") {
          const targetAdmin = targetEntity;

          // Check creation hierarchy for BOTH activation AND deactivation
          // Super admin (createdBy null) can only be managed by themselves
          if (targetAdmin.createdBy === null && req.user.id !== id) {
            return res.status(403).json({
              success: false,
              message: `Cannot ${action} the super admin. Only the super admin can ${action} themselves.`,
              restriction: "super_admin_protected",
              action: action,
            });
          }

          // Check if requesting admin created this admin (for both activation and deactivation)
          if (
            targetAdmin.createdBy &&
            targetAdmin.createdBy.toString() !== req.user.id
          ) {
            return res.status(403).json({
              success: false,
              message: `You can only ${action} admins that you have created`,
              restriction: "admin_creation_hierarchy",
              targetAdminCreatedBy: targetAdmin.createdBy,
              yourId: req.user.id,
              action: action,
            });
          }
        }
      }

      // Special validation for products (store_owner can only manage their own products)
      if (entity === "products" && userRole === "store_owner") {
        // Check ownership for BOTH activation AND deactivation
        if (targetEntity.store_owner_id?.toString() !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: `You can only ${action} your own products`,
            productOwnerId: targetEntity.store_owner_id,
            yourId: req.user.id,
            action: action,
          });
        }
      }

      // Special validation for store_owners being deactivated by admins
      if (entity === "store_owners" && userRole === "admin") {
        // Check if store owner has any active products
        if (!activateStatus) {
          // Only for deactivation
          const activeProducts = await productModel.countDocuments({
            store_owner_id: id,
            isActive: true,
          });

          if (activeProducts > 0) {
            return res.status(400).json({
              success: false,
              message: `Cannot deactivate store owner with ${activeProducts} active product(s)`,
              activeProducts,
              suggestion: "Deactivate or reassign all products first",
            });
          }
        }
      } //TODO => in front handle the admin permission to manage products and reviews

      // Prevent unnecessary update
      if (targetEntity.isActive === activateStatus) {
        return res.status(400).json({
          success: false,
          message: `${modelName} already ${activateStatus ? "active" : "deactivated"}`,
          currentStatus: targetEntity.isActive,
          requestedStatus: activateStatus,
        });
      }

      // Perform the activation/deactivation
      targetEntity.isActive = activateStatus;
      await targetEntity.save();

      // Create audit log with your schema
      try {
        // Determine entity type for audit log
        let auditEntityModel = modelName;
        let auditOperation = "";

        switch (entity) {
          case "clients":
          case "store_owners":
          case "admins":
            auditOperation = activateStatus ? "activateUser" : "deactivateUser";
            break;
          case "categories":
            auditEntityModel = "category";
            auditOperation = activateStatus
              ? "activateCategory"
              : "deactivateCategory";
            break;
          default:
            auditEntityModel = modelName;
            auditOperation = activateStatus
              ? `activate${capitalizeFirstLetter(modelName)}`
              : `deactivate${capitalizeFirstLetter(modelName)}`;
        }

        const auditLog = new auditLogModel({
          admin_id: req.user.id,
          operation: auditOperation,
          operationGroup: "ACTIVATION",
          entityModel: auditEntityModel,
          entityId: targetEntity._id,
          entityName:
            targetEntity.name ||
            targetEntity.email ||
            targetEntity._id.toString(),
          previousStatus: !activateStatus ? "active" : "inactive",
          newStatus: activateStatus ? "active" : "inactive",
          previousData: { isActive: !activateStatus },
          newData: { isActive: activateStatus, updatedAt: new Date() },
        });

        await auditLog.save();
      } catch (auditError) {
        // Don't fail the main operation if audit logging fails
        console.error("Audit log error:", auditError.message);
      }

      // Prepare response data (remove sensitive info)
      const responseData = targetEntity.toObject
        ? targetEntity.toObject()
        : targetEntity;
      if (responseData.password) delete responseData.password;
      if (responseData.__v) delete responseData.__v;

      return res.status(200).json({
        success: true,
        message: `${modelName} ${activateStatus ? "activated" : "deactivated"} successfully`,
        data: {
          id: responseData._id,
          ...responseData,
          status: activateStatus ? "active" : "inactive",
        },
        performedBy: {
          id: req.user.id,
          role: userRole,
          ...(userRole === "admin" && {
            permissions:
              (await adminModel.findById(req.user.id))?.permission || [],
          }),
        },
      });
    } catch (err) {
      console.error("Activation error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  };

  return activation;
};

// Helper function
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

module.exports = ActivationFactory;
