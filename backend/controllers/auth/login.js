const {clientModel, userModel} = require("../../models/users/client");
const {storeOwnerModel} = require("../../models/users/storeOwner");

const bcrypt = require('bcrypt');

const loginController= async (req, res)=>{
    try{
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const formattedEmail = email.trim().toLowerCase();

        const user = await userModel.findOne({ email: formattedEmail });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        let roleData = null;
        if (user.role === "client") {
            roleData = await clientModel.findOne({ user_id: user._id });
        }

        if (user.role === "store_owner") {
            roleData = await storeOwnerModel.findOne({ user_id: user._id });
        }

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        })
    
        
    } catch (error){
         res.status(500).json({ message: error.message });
    }
}

module.exports= loginController;