const nodemailer= require("nodemailer");
const path= require("path");
require("dotenv").config({path: path.join(__dirname, "../.env")});

const transporter= nodemailer.createTransport({
    service: "gmail",
    auth:{
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
    tls:{
        rejectUnauthorized: false,
    }
});

const sendMail= async(content)=>{
    transporter.sendMail({
        from: process.env.EMAIL, 
        to:"semooohany@gmail.com", 
        subject:"payment receipt", 
        text: content
    }, (error, info)=>{
        if(error){
            console.error(`error sending email-> ${error}`);
        }
        else
            console.log(info);
    });
}

module.exports= sendMail;