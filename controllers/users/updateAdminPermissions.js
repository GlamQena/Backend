const { adminModel } = require("../../models/users/admin");
const auditLogModel = require("../../models/users/adminAuditLog");
const { updateAdminPermissionsSchema } = require("../../validations/users");

const updateAdminPermissions = async (req, res) => {
  try {
    const requestingAdminId = req.user.id;
    const { id: targetAdminId } = req.params;

    // 1. Validate the request body using Zod schema
    const parsedData = updateAdminPermissionsSchema.safeParse(req.body);
    if (!parsedData.success) {
      const errors = parsedData.error.issues.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    // 2. check if the requesting admin exists
    const requestingAdmin = await adminModel.findById(requestingAdminId);
    if (!requestingAdmin) {
      return res.status(404).json({
        success: false,
        message: "Requesting admin not found",
      });
    }
    // const requesterIsSuperAdmin = requestingAdmin.createdBy === null;

    // 3. check if the target admin exists
    const targetAdmin = await adminModel.findById(targetAdminId);
    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // 4. check if the requesting admin has permission to edit the target admin's permissions

    // === Old idea (not used anymore, kept here for reference) ===
    // I used to think the super admin (createdBy === null) should bypass all
    // hierarchy restrictions and be able to edit any admin's permissions in
    // the system, even admins they didn't create.
    // I dropped this idea because addUser doesn't allow an admin (not even
    // the super admin) to add an admin with the same permissions as
    // themselves, so it no longer made sense for the super admin to "own and
    // control" admins they didn't actually create.
    // So I went back to applying the normal hierarchy rule to everyone,
    // including the super admin.
    //
    // if (!requesterIsSuperAdmin) {
    //   if (targetAdminId === requestingAdminId) {
    //     return res.status(403).json({
    //       success: false,
    //       message: "You cannot edit your own permissions from this endpoint.",
    //     });
    //   }
    //   if (targetAdmin.createdBy === null) {
    //     return res.status(403).json({
    //       success: false,
    //       message: "Cannot edit the super admin's permissions.",
    //       restriction: "super_admin_protected",
    //     });
    //   }
    //   if (targetAdmin.createdBy.toString() !== requestingAdminId) {
    //     return res.status(403).json({
    //       success: false,
    //       message: "You can only edit permissions for admins you created.",
    //     });
    //   }
    // }

    // === Current rule: same hierarchy applies to everyone, no exceptions ===
    if (targetAdminId === requestingAdminId) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit your own permissions from this endpoint.",
      });
    }

    if (targetAdmin.createdBy === null) {
      // This means the target admin is the super admin
      return res.status(403).json({
        success: false,
        message: "Cannot edit the super admin's permissions.",
        restriction: "super_admin_protected",
      });
    }

    // 5. ensure the requesting admin (super admin included) can only edit permissions
    // for admins they created themselves
    if (targetAdmin.createdBy.toString() !== requestingAdminId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit permissions for admins you created.",
      });
    }

    const previousPermissions = [...targetAdmin.permission];

    targetAdmin.permission = parsedData.data.permission;
    await targetAdmin.save();

    // 6. Log the operation in the admin audit log
    await adminModel.findByIdAndUpdate(requestingAdminId, {
      $set: { lastActivity: new Date() },
      $inc: { totalOperations: 1 },
    });

    const operationLog = await auditLogModel.create({
      admin_id: requestingAdminId,
      operation: "updateAdminPermissions",
      entityModel: "admin",
      entityId: targetAdmin._id,
      operationGroup: "UPDATE",
      previousData: { permission: previousPermissions },
      newData: { permission: targetAdmin.permission },
    });

    return res.status(200).json({
      success: true,
      message: "Admin permissions updated successfully",
      data: targetAdmin,
      operationLog,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: "Validation error", errors });
    }
    console.error("Error in updateAdminPermissions:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = updateAdminPermissions;