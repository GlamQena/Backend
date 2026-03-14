const jwt= require("jsonwebtoken");
const userModel= require("../models/users/user");


const checkAuth= async(req, res, next)=>{
    const token= req.headers.token? req.headers.token : req.cookies.accessToken; 
    //consider the token come as a header prop from postman or with Authorization from frontend 'Bearer [token]'.

    if(!token)
        return res.status(401).json({message: "you're not authorized, please login first!"});
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedToken)=>{
        if(err){
            return res.status(401).json({message: `error decoding the access token-> ${err}`});
        }
        const user= await userModel.findOne({role: decodedToken.role, _id:decodedToken.user_id}).lean();
        console.log("checkAuth user-> ", user);
        req.user= user;
        next();
    });
}

module.exports= checkAuth;