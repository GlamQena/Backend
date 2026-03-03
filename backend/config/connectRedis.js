const {createClient}= require("redis");
const path= require("path");

require('dotenv').config({path: path.join(__dirname, '../.env')});

const client= createClient({url: process.env.REDIS_URI});
client.on('error', (err)=>{
    console.log(`error connecting redis database-> ${err}`);
});

const connect_redis= async ()=>{
    await client.connect();

    client.set("test", "successful");
    console.log(`${await client.get('test')} redis conection...`);
}

module.exports= {connect_redis, client};