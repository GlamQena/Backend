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

const sendMail= async(options)=>{
    transporter.sendMail(options, (error, info)=>{
        if(error){
            console.error(`error sending email-> ${error}`);
        }
        else
            console.log(info);
    });
}

module.exports= sendMail;