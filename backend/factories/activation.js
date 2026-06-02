const adminModel = require("../models/users/admin");
const auditLogModel = require("../models/users/adminAuditLog");

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
                    availableEntities: Object.keys(activableModels)
                });
            }

            // Get entity configuration
            const { model, modelName, allowedRoles } = activableModels[entity];
            
            // Check role-based access (from checkAuth middleware)
            const userRole = req.user?.role;
            if (!userRole || !allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. ${allowedRoles.join(", ")} only`,
                    yourRole: userRole || "unknown"
                });
            }

            // Validate activate query parameter
            if (activate === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "activate query parameter is required",
                    example: `PATCH /${entity}/${id}/activation?activate=true`
                });
            }

            if (activate !== "true" && activate !== "false") {
                return res.status(400).json({
                    success: false,
                    message: "activate must be 'true' or 'false'",
                    received: activate
                });
            }

            const activateStatus = activate === "true";

            // Find the target entity
            const targetEntity = await model.findById(id);
            if (!targetEntity) {
                return res.status(404).json({
                    success: false,
                    message: `${modelName} not found`,
                    id: id
                });
            }

            // Prevent self activation/deactivation
            if (modelName === "user" && req.user.id === id) {
                return res.status(403).json({
                    success: false,
                    message: `You cannot change your own activation status`,
                    entity: modelName
                });
            }

            // ============= PERMISSION-BASED VALIDATIONS =============
            
            // For admin role, check specific permissions
            if (userRole === "admin") {
                // Get the requesting admin's permissions
                const requestingAdmin = await adminModel.findById(req.user.id);
                
                if (!requestingAdmin) {
                    return res.status(403).json({
                        success: false,
                        message: "Admin permissions not found"
                    });
                }

                // Check permission based on entity type
                let hasPermission = false;
                let requiredPermission = "";

                switch (entity) {
                    case "users":
                        requiredPermission = "manageUsers";
                        hasPermission = requestingAdmin.permission?.includes("manageUsers");
                        break;
                    case "categories":
                        requiredPermission = "manageCategories";
                        hasPermission = requestingAdmin.permission?.includes("manageCategories");
                        break;
                    case "reviews":
                        requiredPermission = "manageUsers"; // Reviews belong to users
                        hasPermission = requestingAdmin.permission?.includes("manageUsers");
                        break;
                    default:
                        hasPermission = true;
                }

                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: `Permission denied. You need the '${requiredPermission}' permission to ${activateStatus ? "activate" : "deactivate"} ${entity}`,
                        requiredPermission: requiredPermission,
                        yourPermissions: requestingAdmin.permission || []
                    });
                }
            }

            // Special validation for admin activation/deactivation
            if (targetEntity.role === "admin" && userRole === "admin") {
                const requestingAdmin = await adminModel.findById(req.user.id);
                const targetAdmin = targetEntity;

                if (!requestingAdmin) {
                    return res.status(403).json({
                        success: false,
                        message: "Admin permissions not found"
                    });
                }

                // Check if has manageAdmins permission
                if (!requestingAdmin.permission?.includes("manageAdmins")) {
                    return res.status(403).json({
                        success: false,
                        message: `Permission denied. You need the 'manageAdmins' permission to ${activateStatus ? "activate" : "deactivate"} admins`,
                        requiredPermission: "manageAdmins",
                        yourPermissions: requestingAdmin.permission || []
                    });
                }

                // Only for deactivation, check creation hierarchy
                if (!activateStatus && targetAdmin) {
                    // Super admin (createdBy null) cannot be deactivated by others
                    if (targetAdmin.createdBy === null) {
                        return res.status(403).json({
                            success: false,
                            message: "Cannot deactivate the super admin. Only the super admin can deactivate themselves.",
                            restriction: "super_admin_protected"
                        });
                    }
                    
                    // Check if requesting admin created this admin
                    if (targetAdmin.createdBy && targetAdmin.createdBy.toString() !== req.user.id) {
                        return res.status(403).json({
                            success: false,
                            message: "You can only deactivate admins that you have created",
                            restriction: "admin_creation_hierarchy",
                            targetAdminCreatedBy: targetAdmin.createdBy,
                            yourId: req.user.id
                        });
                    }
                }
            }

            // Special validation for products (store_owner can only deactivate their own products)
            if (entity === "products" && userRole === "store_owner") {
                // Check if the product belongs to this store owner
                if (targetEntity.store_owner_id?.toString() !== req.user.id) {
                    return res.status(403).json({
                        success: false,
                        message: "You can only deactivate your own products",
                        productOwnerId: targetEntity.store_owner_id,
                        yourId: req.user.id
                    });
                }
            }

            // Prevent unnecessary update
            if (targetEntity.isActive === activateStatus) {
                return res.status(400).json({
                    success: false,
                    message: `${modelName} already ${activateStatus ? "active" : "deactivated"}`,
                    currentStatus: targetEntity.isActive,
                    requestedStatus: activateStatus
                });
            }

            // Perform the activation/deactivation
            targetEntity.isActive = activateStatus;
            await targetEntity.save();

            // Create audit log
            try {
                const operation = activateStatus ? `activate${capitalizeFirstLetter(modelName)}` : `deactivate${capitalizeFirstLetter(modelName)}`;
                const operationGroup = "ACTIVATION";
                
                const auditLog = new auditLogModel({
                    admin_id: req.user.id,
                    operation,
                    operationGroup,
                    entityModel: modelName === "user" ? targetEntity.role : modelName,
                    entityId: targetEntity._id,
                    previousStatus: !activateStatus ? "active" : "inactive",
                    newStatus: activateStatus ? "active" : "inactive",
                });
                
                await auditLog.save();
            } catch (auditError) {
                // Don't fail the main operation if audit logging fails
                console.error("Audit log error:", auditError.message);
            }

            // Prepare response data (remove sensitive info)
            const responseData = targetEntity.toObject ? targetEntity.toObject() : targetEntity;
            if (responseData.password) delete responseData.password;
            if (responseData.__v) delete responseData.__v;

            return res.status(200).json({
                success: true,
                message: `${modelName} ${activateStatus ? "activated" : "deactivated"} successfully`,
                data: {
                    id: responseData._id,
                    [modelName]: responseData,
                    status: activateStatus ? "active" : "inactive"
                },
                performedBy: {
                    id: req.user.id,
                    role: userRole,
                    ...(userRole === "admin" && { 
                        permissions: (await adminModel.findById(req.user.id))?.permission || [] 
                    })
                }
            });

        } catch (err) {
            console.error("Activation error:", err);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? err.message : undefined
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