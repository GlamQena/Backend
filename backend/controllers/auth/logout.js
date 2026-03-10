const logoutController= async (req, res)=>{
    try{
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        res.status(200).json({message: "user logout and his tokens removed successfully..."});

    } catch(error){
        res.status(500).json({ message:"internal server error!", error: error.message});
    }    
}

module.exports= logoutController;