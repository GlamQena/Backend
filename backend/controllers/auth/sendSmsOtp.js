const userModel= require('../../models/users/user');
const twilio= require("twilio");
const crypto= require("crypto");
const {redisClient}= require("../../config/connectRedis");

const sendSmsOtpController= async (req, res)=>{
    try{
        const {phone} =req.body;
        redisClient.del(`otp ${phone}`);
        if(await redisClient.get(`otp ${phone}`))
            res.status(400).json({message: "you're otp already sent, try again later"});
        const twilioClient= twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const OTP= crypto.randomInt(100000, 900000).toString() //Math.floor((Math.random()*900000)+100000).toString();
        redisClient.set(`otp ${phone}`, OTP, {EX: 10});
        console.log(phone);
        const message= await twilioClient.messages.create({body: `you're verification otp-> ${OTP}`, from: process.env.TWILIO_PHONE_NUMBER, to:phone});
        res.status(200).json({message: `OTP sent to you phone with sid-> ${message.sid}`});
    }catch(err){
        res.status(500).json({message:`internal server error-> ${err}`});
    }
}

module.exports= sendSmsOtpController;