import mongoose from 'mongoose';

const connect_mongodb= async()=>{
    try{
        mongoose.connect(process.env.MONGO_URI);
    }catch(err){
        console.error(`error connecting to mongodb-> ${err}`);
    }
}

module.exports= {connect_mongodb};