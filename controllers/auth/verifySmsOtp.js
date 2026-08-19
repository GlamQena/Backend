const userModel= require('../../models/users/user');
const {redisClient}= require("../../config/connectRedis");

const verifySmsController= async (req, res)=>{
    const {otp, phone}= req.body;
    const storedOtp= await redisClient.get(`otp ${phone}`);
    if(storedOtp===otp){
        res.status(200).json("you're phone verifed successfully...");
    }
    else{
        res.status(401).json("invalid OTP!");
    }
}

module.exports= verifySmsController;