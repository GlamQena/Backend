const express= require('express');
const path= require('path');
const cors= require("cors");
const session= require("express-session");
const cookie_parser= require("cookie-parser");
import connect_mongodb from './config/connectMongoDB.js';
import mongoose from 'mongoose';
import authRouter from './router/auth.js';

require('dotenv').config({path: path.join(__dirname, './env')});

const app=express();
app.use(express.json());

//enable cookies
const allowedOrigins=["http://127.0.0.1:3000", 
    "http://localhost:3001", 
    "http://localhost:3000", 
    "http://192.168.1.100:3000" //dev machine ip
]; //possible localhost origins

app.use(cors({origin:(origin, callback)=>{
    if(!origin || allowedOrigins.includes(origin)) //if the request has no origin (e.g. mobile apps) or included in the allowed list,
        callback(null, true);//call the callback with no Error message and allow the origin
    else
        callback(new Error("this origin not allowed by cors!"), false);
    },
    credentials: true //allow cookies
}));

app.use(cookie_parser());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie:{
        httpOnly: true, //httpOnly cookie means its related to the requests itself and can't be accessed by javaScript
        maxAge: 7* 24* 60* 60* 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    }
}));

//routes
app.use("/auth", authRouter);

//mongodb connection
connect_mongodb();

mongoose.connection.once("connected", ()=>{
    console.log("server connected to mongodb successfully...");
    app.listen(process.env.PORT, (err)=>{
        if(err){
            console.error(`error listening on port: ${process.env.PORT}!`);
        }
        else{
            console.log(`express server listenning on port-> ${process.env.PORT}...`);
        }
    });
});

mongoose.connection.on("error", (err)=>{
    console.error(`error connecting to mongodb-> ${err}`);
})