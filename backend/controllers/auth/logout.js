const Cart = require("../../models/cart");

const logoutController= async (req, res)=>{
    try{
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        const session_id = req.query.session_id || null;
        let deletedSessionCart= null;
        if(session_id)
            deletedSessionCart = await Cart.findOneAndDelete({session_id});

        const message= `user logout and his tokens${deletedSessionCart? " and session cart": ""} removed successfully...`;
        console.log(message);
        res.status(200).json({message});

    } catch(error){
        res.status(500).json({ message:"internal server error!", error: error.message});
    }    
}

module.exports= logoutController;