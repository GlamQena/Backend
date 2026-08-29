const crypto = require("crypto");
const bcrypt = require("bcrypt");
const connect_mongodb = require("../config/connectMongoDB");
const {adminModel} = require("../models/users/admin");

const initialAdmin = {
  "username": "semon_admin",
  "email": "semonadmin@gmail.com",
  "role": "admin",
  "phoneNumber": "01286264392",
  "birthdate": "2004-01-10T22:00:00.000Z",
  "gender": "female",
  "permission": [
    "viewAnalytics",
    "manageUsers",
    "manageOrders",
    "manageCategories",
    "manageStores",
    "manageAdmins"
  ],
  "isActive": true
}

const createRandomPassword = (length)=>{
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=';
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';
  const buffer = crypto.randomBytes(length); //return a buffer of bytes with the same passed length

  for(let i=0; i<length; i++){
    const randomIndex = buffer[i] % allChars.length; //buffer[i] is the decimal number (0 - 255) % allChars.length ensure the random index won't exceed the allChars.length-1
    password += allChars[randomIndex];
  }

  let passwordArray = password.split("");
  const ensure = [
    uppercase[Math.floor(Math.random()*uppercase.length)],
    lowercase[Math.floor(Math.random()*lowercase.length)],
    numbers[Math.floor(Math.random()*numbers.length)],
    symbols[Math.floor(Math.random()*symbols.length)],
  ] //ensure the created randommly password will contain at least one pf each character type

  passwordArray[0] = ensure[0];
  passwordArray[1] = ensure[1];
  passwordArray[2] = ensure[2];
  passwordArray[3] = ensure[3];

  //shuffle the password array for the predictable first four ensure chars to be randomized
  for(let i=passwordArray.length-1; i>0; i--){
    const j= Math.floor(Math.random() * (i+1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join("");
}

const seedAdmin= async ()=>{
    try{
        await connect_mongodb();
        const foundAdmin = await adminModel.findOne({username: initialAdmin["username"], email: initialAdmin["email"]});

        if(foundAdmin){
            console.error("the initial admin already seeded before");
            return;
        }
        randomPassword = createRandomPassword(16);
        hashPassword = bcrypt.hashSync(randomPassword, 10);
        initialAdmin["password"] = hashPassword;
        const seededAdmin= await adminModel.create(initialAdmin);
        console.log("seeded initial admin ", seededAdmin);
    }catch(e){
        console.error("error seeding the initial admin: ", e);
    }
}

seedAdmin();