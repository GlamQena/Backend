const {createClient}= require("redis");
const path= require("path");

require('dotenv').config({path: path.join(__dirname, '../.env')});

const redisClient= createClient({url: process.env.REDIS_URI});
redisClient.on('error', (err)=>{
    console.log(`error connecting redis database-> ${err}`);
});

const connect_redis= async ()=>{
    await redisClient.connect();

    redisClient.set("test", "successful");
    console.log(`${await redisClient.get('test')} redis connection...`);
}

module.exports= {connect_redis, redisClient};