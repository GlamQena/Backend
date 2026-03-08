const userModel= require('../../models/users/user');

const Customer = require('../../models/users/customer');  
const StoreOwner = require('../../models/users/storeOwner');  
const DeliveryAgent = require('../../models/users/deliveryAgent');

const bcrypt = require('bcryptjs');

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
        if (user.role === "customer") {
            roleData = await Customer.findOne({ user_id: user._id });
        }

        if (user.role === "store_owner") {
            roleData = await StoreOwner.findOne({ user_id: user._id });
        }

        if (user.role === "delivery_agent") {
            roleData = await DeliveryAgent.findOne({ user_id: user._id });
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