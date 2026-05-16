//TODO => 
// based on a query param send to mark operation [ex. activate="true"]
// prevent activattion when the category already active and vice versa
const categoryModel = require("../../models/category");

const activateDeactivateCategory = async (req, res) => {
    try {

        // allow only admins
        if (req.user.role !== "admin") {
           return res.status(403).json({
               message: "access denied, admin only"
            });
        }
        
        const { id } = req.params;
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

        const activateStatus = activate === "true";

        const category = await categoryModel.findById(id);

        if (!category) {
            return res.status(404).json({
                message: "category not found"
            });
        }

        // prevent unnecessary update
        if (category.isActive === activateStatus) {
            return res.status(400).json({
                message: `category already ${activateStatus ? "active" : "deactivated"}`
            });
        }

        category.isActive = activateStatus;

        await category.save();

        return res.status(200).json({
            message: `category ${activateStatus ? "activated" : "deactivated"} successfully`,
            category
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

module.exports = activateDeactivateCategory;
