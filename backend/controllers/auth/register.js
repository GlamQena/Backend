const {clientModel, userModel} = require("../../models/users/client");
const {storeOwnerModel} = require("../../models/users/storeOwner");
const cartModel= require("../../models/cart");
const bcrypt = require("bcrypt");

const registerController = async (req, res) => {
  try {
    const { role, username, email, password, confirm_password, ...rest } =
      req.body;

    if (!role || !username || !email || !password || !confirm_password) {
      return res
        .status(400)
        .json({ message: "role and authentication fields are required!" });
    }

    if(role!="client" && role!="store_owner")
        return res.status(400).json({message: "not valid role!"});

    if (role === "store_owner") {
      const {store_name, store_email, store_phone, store_address}= rest;
      if(!store_name ||! store_email ||! store_phone ||! store_address)
        return res.status(400).json({message: "all store credentials are required!"});
      var storeCredentials= {store_name, store_email, store_phone, store_address};
    }

    const formattedEmail = email.trim().toLowerCase();
    const formattedUsername = username.trim().toLowerCase();

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters!" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match!" });
    }

    const existingUser = await userModel.findOne({
      $or: [{ email: formattedEmail }, { username: formattedUsername }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "username or email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const commonData = {
      username: formattedUsername,
      email: formattedEmail,
      password: hashedPassword,
      phone: rest.phone || null,
      birthdate: rest.birthdate || null,
      address: {
        city: rest.address?.city || null,
        district: rest.address?.district || null,
        street: rest.address?.street || null,
      },
      gender: rest.gender && rest.gender.trim().toLowerCase(),
    };

    if (role === "client") {
      const newCart= await cartModel.create({products: [], total_price:0});
      await clientModel.create({cart_id: newCart._id, ...commonData});
    }

    if (role === "store_owner") {
      await storeOwnerModel.create({ ...commonData, ...storeCredentials});
    }

    res.status(201).json({
      message: "user account created successfully...",
      role,
    });

    //TODO-> send verifyEmailToken
  } catch (error) {
    res.status(500).json({ message: "internal server error!", error:error.message });
  }
};

module.exports = registerController;
