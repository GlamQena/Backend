const userModel = require("../../models/users/user");
const {changePasswordSchema}= require("../../validations/auth");
const bcrypt= require("bcrypt");

const changePasswordController = async (req, res) => {
    try{
        console.log(req.body);
        const { email, currentPassword, newPassword, confirmNewPassword } = req.body;

        if(!email || !currentPassword || !newPassword || !confirmNewPassword)
            return res.status(400).json({message: "you must provide email, currentPassword, newPassword and confirmNewPassword"});

        const parsedResetPassSchema= changePasswordSchema.safeParse({currentPassword, newPassword, confirmNewPassword});
        if(!parsedResetPassSchema.success){
            return res.status(400).json({message: parsedResetPassSchema.error.issues[0].message});
        }

        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            return res.status(404).json({ message: "your account doesn't exist!" });
        }

        let passwordMatch;
        try{
            passwordMatch= bcrypt.compareSync(currentPassword, user.password);
        }catch(error){
            return res.status(400).json({message: "failed verifying the current password", error: error.message});
        }

        if(!passwordMatch)
            return res.status(400).json({message: "invalid current password"});

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: "Password updated successfully, please login again with it" });

    }catch(error){
        res.status(500).json({message: "some error occured while changing password", error: error.message});
    }
};

module.exports = changePasswordController;
