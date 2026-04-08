const mongoose= require('mongoose');
const path= require('path');

require("dotenv").config({path: path.join(__dirname, "../.env")});

const connect_mongodb= async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
    }catch(err){
        console.error(`error connecting to mongodb-> ${err}`);
    }
}

module.exports= connect_mongodb;