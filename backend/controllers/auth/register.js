const {clientModel, userModel} = require("../../models/users/client");
const {storeOwnerModel} = require("../../models/users/storeOwner");
const cartModel= require("../../models/cart");
const bcrypt = require("bcrypt");
const { setUserVerification } = require("../../utils/mailSender");
const { registerSchema, storeOwnerSpecificRegister}= require("../../validations/auth");

const registerController = async (req, res) => {
  try {
    const parsedRegister= registerSchema.safeParse(req.body);
    if(!parsedRegister.success)
      return res.status(400).json({message: parsedRegister.error.issues[0].message});
console.log("parsed data: ", parsedRegister.data);
    const { role, username, email, password, ...otherData} = parsedRegister.data;

    let parsedStoreOwnerRegister;
    if (role === "store_owner") {
      parsedStoreOwnerRegister= storeOwnerSpecificRegister.safeParse(req.body);
      if(!parsedStoreOwnerRegister.success)
      return res.status(400).json({message: parsedStoreOwnerRegister.error.issues[0].message});
    }

    const existingUser = await userModel.findOne({
      $or: [{ email: email }, { username: username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "username or email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser
    const commonData = {
      username,
      email,
      password: hashedPassword,
      phone: otherData.phone || null,
      birthdate: otherData.birthdate || null,
      gender: otherData.gender || null,
      address: otherData.address || null,
    };

    if (role === "client") {
      const newCart= await cartModel.create({products: [], total_price:0});
      newUser = await clientModel.create({cart_id: newCart._id, ...commonData});//save client in newUser
    }

    if (role === "store_owner") {
      if(!parsedStoreOwnerRegister)
        return res.status(400).json({message: "store owner account validations failed!"});
      
      newUser = await storeOwnerModel.create({ ...commonData, ...parsedStoreOwnerRegister.data});//save store owner in newUser
    }

      // send verifyEmailToken to user email and set isEmailVerified to false until user verify his email
    if (!newUser) {
      return res.status(400).json({ message: "user account not created!" });
    }
    
      await setUserVerification(newUser, "10m");

    res.status(201).json({
      message: "verification link sent to your email to activate your created account!",
      role,
    });

  } catch (error) {
    res.status(500).json({ message: "internal server error!", error:error.message });
  }
};

module.exports = registerController;
