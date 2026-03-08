const userModel= require('../../models/users/user');

const logoutController= async (req, res)=>{
    try{

    } catch(error){
        res.status(500).json({ message: error.message})
    }    
}

module.exports= logoutController;