const userModel= require('../../models/users/user');

const bcrypt = require('bcryptjs');

const registerController= async (req, res)=>{
    try{
        const { role,username, email, password, confirm_password,phone, ...rest } = req.body; 

        if (!role ||!username || !email || !password || !confirm_password || !phone) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        const formattedEmail = email.trim().toLowerCase();

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const existingUser = await userModel.findOne({ email: formattedEmail });
        if(existingUser){
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            role,
            username,
            email:formattedEmail,
            password: hashedPassword,
            phone,
            first_name: rest.first_name || null,
            last_name: rest.last_name || null,
            birthdate: rest.birthdate || null,
            address: {
              city: rest.city || null,
              street: rest.street || null
            }
        });

        if (role === "customer") {
            await Customer.create({
                user_id: user._id, gender: rest.gender ,skin_type: rest.skin_type, skin_interests: rest.skin_interests});
        }

        if (role === "store_owner") {
            await store_owner.create({
                user_id: user._id,business_email: rest.business_email,business_phone: rest.business_phone});
        }

        if (role === "delivery_agent") {
            if (rest.vehicle !== "public_transport" && !rest.palette_number){
                return res.status(400).json({ message: "Palette number required " });
            }
            await delivery_agent.create({
                user_id: user._id,vehicle: rest.vehicle, palette_number: rest.palette_number });
        }

        res.status(201).json({
             message: "User registered successfully",
             user_id: user._id,
             role: user.role
        })

    } catch (error){
        res.status(500).json({ message: error.message})
    }
}

module.exports= registerController;