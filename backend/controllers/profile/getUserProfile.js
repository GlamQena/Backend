const {clientModel}= require("../../models/users/client");
const {adminModel}= require("../../models/users/admin");
const {storeOwnerModel}= require("../../models/users/storeOwner");

const getUserProfileController= async (req, res)=>{
    try {
        const {id, role}= req.user;

        let model;

        switch (role) {
            case 'client':
                model = clientModel;
                break;
            case 'store_owner':
                model = storeOwnerModel;
                break;
            case 'admin':
                model = adminModel;
                break;
            default:
                model = clientModel;
        }

        const user = await model.findById(id).lean();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        
        return res.status(500).json({
            message: "Error fetching user profile", error: error.message });
    }
}

module.exports= getUserProfileController;