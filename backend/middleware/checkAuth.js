const jwt= require("jsonwebtoken");
const userModel= require("../models/users/user");


const checkAuth= async(req, res, next)=>{
    const token= req.headers.token? req.headers.token : req.cookies.access_token; 
    //consider the token come as a header prop from postman or with Authorization from frontend 'Bearer [token]'.

    if(!token)
        res.status(401).json({message: "you're not authorized, please login first!"});
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken)=>{
        if(err){
            res.status(401).json({message: `error decoding the access token-> ${err}`});
        }
        req.user= await userModel.findOne({role: decodedToken.role, id:decodedToken.user_id}).lean();
        next();
    });
}

module.exports= checkAuth;