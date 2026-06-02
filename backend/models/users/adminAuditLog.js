const mongoose= require("mongoose");

const AuditLogSchema = new mongoose.Schema({
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin",
        required: true,
        index: true,
    },

    operation: {
        type: String,
        enum: [
            "addUser", "addCategory", 
            "deleteUser", "deleteCategory",
            "activateUser", "activateCategory",
            "deactivateUser", "deactivateCategory",
            "acceptRegisteration", "cancelRegisteration",
            "editCategory", 
            "updateOrderStatus", 
            "updateUserDeletionStatus"
        ],
        required: true,
    },

    operationGroup: {
        type: String,
        enum: [
            "CREATE", 
            "DELETE", //for category, admin or store owner
            "UPDATE", //editCategory or update status of order or userDeletion
            "APPROVAL", //cancel/accept
            "ACTIVATION" //activate/deactivate
        ],
    },

    entityModel: {
        type: String,
        enum: ["admin", "category", "store_owner", "client", "order"],
        required: true,
    },

    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "entityModel",
        required: true,
    },

    entityName: {
        type: String,
        default: null,
    },

    previousStatus: {
        type: String,
        default: null,
    },

    newStatus: {
        type: String,
        default: null,
    }, //for tracking activation status, order status update or user deletion status

    previousData:{
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    newData:{
        type: mongoose.Schema.Types.Mixed,
        default: null,
    } //for tracking edit category data change
}, {
    timestamps: true,
    versionKey: false,
});

const auditLogModel = new mongoose.model("audit_log", AuditLogSchema);
module.exports= auditLogModel;