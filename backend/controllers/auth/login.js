const {clientModel, userModel} = require("../../models/users/client");
const {storeOwnerModel} = require("../../models/users/storeOwner");
const jwt= require("jsonwebtoken");
const bcrypt = require('bcrypt');

const loginController= async (req, res)=>{
    try{
        const {emailOrUsername, password, rememberMe } = req.body;

        if (!emailOrUsername || !password) {
            return res.status(400).json({ message: "username|email and password are required" });
        }

        const formattedEmailOrUsername = emailOrUsername.trim().toLowerCase();

        // if(role!="client" && role!="store_owner")
        //     return res.status(400).json({message:"invalid user role!"});
        
        const user= await userModel.findOne({ $or:[{email: formattedEmailOrUsername}, {username: formattedEmailOrUsername}]}).select("+password");

        if (!user) {
            return res.status(401).json({ message: "Invalid email or username" });
        }

        try{
            const isMatch = bcrypt.compareSync(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid password" });
            }
        }catch(error){
            return res.status(400).json({message:"error comparing the password with the exist one!", error: error.message});
        }
                
        let userData;
        if (user.role === "client") {
            userData = await clientModel.findOne({ _id: user._id }).lean();
        }

        if (user.role === "store_owner") {
            userData = await storeOwnerModel.findOne({ _id: user._id }).lean();
        }

        const accessToken= jwt.sign({user_id:user._id, role:user.role}, process.env.ACCESS_TOKEN_SECRET);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV=="PRODUCTION",
            maxAge: 15*60*1000,
            samesite: "strict",
        });

        const refreshTokenAge= rememberMe? 30*24*60*60*1000 : 7*24*60*60*1000;
        const refreshToken= jwt.sign({user_id:user._id, role:user.role}, process.env.REFRESH_TOKEN_SECRET);
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV=="PRODUCTION",
            maxAge: refreshTokenAge,
            samesite: "strict",
        });

        res.status(200).json({
            message: "user logged in successfully...",
            user: userData,
        });
        
    } catch (error){
         res.status(500).json({ message: error.message });
    }
}

module.exports= loginController;