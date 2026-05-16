const userModel= require('../../models/users/user');

const checkActivation = async (req, res, next) => {

    try {

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "unauthorized"
            });
        }

        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "user not found"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "your account has been deactivated"
            });
        }

        next();

    } catch (err) {

        return res.status(500).json({
            message: err.message
        });
    }
};

module.exports = checkActivation;