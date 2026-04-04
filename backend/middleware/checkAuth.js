const jwt= require("jsonwebtoken");
const {clientModel}= require("../models/users/client");
const {adminModel}= require("../models/users/admin");
const {storeOwnerModel}= require("../models/users/storeOwner");

const checkAuth= async(req, res, next)=>{
    const token= req.headers.token? req.headers.token : req.cookies.refreshToken;
    //consider the token come as a header prop from postman or with Authorization from frontend 'Bearer [token]'.

    if(!token)
        return res.status(401).json({message: "you're not authorized, please login first!"});

    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decodedToken)=>{
        if(err){
            return res.status(401).json({message: `error decoding the refresh token-> ${err}`});
        }

        console.log("decoded token => ", decodedToken);

        const userRole= decodedToken.role;
        const userId= decodedToken.user_id;

        req.user = {
            user_id: decodedToken.user_id,
            role: decodedToken.role
        };

        let model;

        switch (userRole) {
            case 'client':
                model = clientModel;
                break;
            case 'store_owner':
                model = storeOwnerModel;
                break;
            case 'admin':
                model = adminModel;
                break;
            default:
                model = clientModel;
        }

        const user = await model.findById(userId).lean();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("checkAuth user-> ", user);
        next();
    });
}

module.exports= checkAuth;