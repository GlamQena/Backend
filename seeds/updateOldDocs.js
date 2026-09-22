const userModel = require("../models/users/user");
const connect_mongodb = require("../config/connectMongoDB");

const updateOldDocs = async () => {
  try{
    await connect_mongodb();

    await userModel.updateMany(
      { preferences: { $exists: false } },
      { $set: { preferences: { theme: "system", locale: "ar" } } },
      { runValidators: true}
    );

    console.log("old documents updated successfully");
  }catch(err){
    console.log(`error updating the old document: ${err.message}`);
  }
}

updateOldDocs();