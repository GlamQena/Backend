const {clientModel, userModel} = require("../../models/users/client");
const {storeOwnerModel} = require("../../models/users/storeOwner");
const setAccessRefreshTokens= require("../../utils/acc_ref_tokens");
const {loginSchema}= require("../../validations/auth");
const bcrypt = require('bcrypt');

const loginController= async (req, res)=>{
    try{
        const {usernameOrEmail, password, rememberMe } = req.body;

        const validatedLoginSchema= loginSchema.safeParse({usernameOrEmail, password});
        if(!validatedLoginSchema.success)
            return res.status(400).json({message: validatedLoginSchema.error.issues[0].message});

        const user= await userModel.findOne({ $or:[{email: usernameOrEmail}, {username: usernameOrEmail}]}).select("+password");

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
            userData = await clientModel.findOne({ _id: user._id }).select("-password").lean();
        }

        if (user.role === "store_owner") {
            userData = await storeOwnerModel.findOne({ _id: user._id }).select("-password").lean();
        }

        await setAccessRefreshTokens(res, user, rememberMe);
        if(userData.password){
            delete userData.password;
        }

        res.status(200).json({
            message: "user logged in successfully...",
            user: userData,
        });
        
    } catch (error){
         res.status(500).json({ message: "internal server error", error:error.message});
    }
}

module.exports= loginController;