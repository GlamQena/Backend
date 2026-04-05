const jwt= require("jsonwebtoken");
const {clientModel}= require("../../models/users/client");
const {storeOwnerModel}= require("../../models/users/storeOwner");
const {adminModel}= require("../../models/users/admin");
const {setAccessToken}= require("../../utils/acc_ref_tokens");

const refreshAccessTokenController= async(req, res)=>{
    let refreshToken;
    const headerAuth=req.headers.authorization || req.headers.Authorization;
    if( headerAuth && headerAuth.startsWith("Bearer"))
        refreshToken= headerAuth.split(" ")[1];
    else
        refreshToken= req.cookies.refreshToken;

    if(!refreshToken)
        return res.status(401).json({message:"expired refresh token!"});

    let decodedRefreshToken;
    
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decodedToken)=>{
        if(error)
            return res.status(401).json({message: "failed to decrypt the refresh token!"});
        decodedRefreshToken = decodedToken;
    });

    const {user_id, role} = decodedRefreshToken;
    let loggedUser;

    switch(role){
        case "client":
            loggedUser= await clientModel.findOne({_id: user_id}).lean();
            break;
        case "store_owner":
            loggedUser= await storeOwnerModel.findOne({_id: user_id}).lean();
            break;
        case "admin":
            loggedUser= await adminModel.findOne({_id: user_id}).lean();
            break;
        default:
            return res.status(401).json({message:"doesn't supported role!"});
    }

    if(!loggedUser)
        return res.status(401).json({message: "user not found"});

    const accessToken= setAccessToken(res, loggedUser);
    res.status(200).json({message: "access token refreshed successfully", user: loggedUser, accessToken});
}

module.exports= refreshAccessTokenController;