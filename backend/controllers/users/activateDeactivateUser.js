const userModel = require("../../models/users/user");

const activateDeactivateUser = async (req, res) => {

    try {
        // allow only admins
        if (req.user.role !== "admin") {
           return res.status(403).json({
               message: "access denied, admin only"
            });
        }

        const { id } = req.params; //Target user
        const { activate } = req.query;

        if (activate === undefined) {
            return res.status(400).json({
                message: "activate query parameter is required"
            });
        }

        if (activate !== "true" && activate !== "false") {
            return res.status(400).json({
                message: "activate must be true or false"
            });
        }
        // convert string to boolean
        const activateStatus = activate === "true";

        const user = await userModel.findById(id)
           .select("-password")

        // check if user exists
        if (!user) {
            return res.status(404).json({
                message: "user not found"
            });
        }

        // prevent user/admin from activating or deactivating themselves
        if (req.user.id === id) {
            return res.status(403).json({
                message: "you cannot change your own activation status"
            });
        }


        // prevent unnecessary update
        if (user.isActive === activateStatus) {
            return res.status(400).json({
                message: `user already ${activateStatus ? "active" : "deactivated"}`
            });
        }

        user.isActive = activateStatus;

        await user.save();

        return res.status(200).json({
            message: `user ${activateStatus ? "activated" : "deactivated"} successfully`,
            user
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

module.exports = activateDeactivateUser;