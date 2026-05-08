const jwt= require("jsonwebtoken");
const userModel = require("../../models/users/user");
const {setUserVerification}= require("../../utils/mailSender");

const sendEmailTokenController = async (req, res) => {
  try {
    const {email} = req.body;

    if(!email)
        return res.status(400).json({message: "email is required"});

    const user= await userModel.findOne({email});

    if(!user)
        return res.status(404).json({message: "user not found"});

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: "Email already verified",
      });
    }

    try{
    setUserVerification(user, "10m");
    }catch(error){
        return res.status(400).json({message: "error occured while sending verification link, try again"});
    }
    
    res.status(200).json({message: "email verification link sent successfully"});
  } catch (error) {

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports =  sendEmailTokenController ;