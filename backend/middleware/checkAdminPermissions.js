//TODO =>
//check if the user who sent the request (req.user.id) model permission list has at least one of the allowedPermission which passed as a parameter to this function which at last return middleware (req, res, next)
//   "viewAnalytics",
//   "manageUsers",
//   "manageOrders",
//   "manageCategories",
//if true go to the next basic endpoint [next()] else return error response
const adminModel = require("../../models/users/admin");

const checkAdminPermissions = (allowedPermission) => {

    return async (req, res, next) => {

        try {

            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    message: "unauthorized"
                });
            }

            const admin = await adminModel.findById(req.user.id);

            if (!admin) {
                return res.status(404).json({
                    message: "admin not found"
                });
            }

            // convert permission parameter to array
            const allowedPermissions = Array.isArray(allowedPermission)
                ? allowedPermission
                : [allowedPermission];

            // check if admin has at least one allowed permission
            const hasPermission = allowedPermissions.some((permission) =>
                admin.permission.includes(permission)
            );

            // if no permission found
            if (!hasPermission) {

                return res.status(403).json({
                    message: "missing required permission"
                });
            }

            next();

        } catch (err) {

            return res.status(500).json({
                message: err.message
            });
        }
    };
};

module.exports = checkAdminPermissions;
