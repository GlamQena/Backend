const path= require("path");
require("dotenv").config({path: path.join(__dirname, "../.env")});
const jwt= require("jsonwebtoken");


const setAccessRefreshTokens= async (req, res, user, rememberMe=false)=>{
    try{
        setAccessToken(req, res, user);

       const tokenMaxAge= rememberMe? process.env.REFRESH_TOKEN_COOKIE_MAX_AGE_REMEMBER_ME : process.env.REFRESH_TOKEN_COOKIE_MAX_AGE_NORMAL;
        const refreshTokenAge= rememberMe? process.env.REFRESH_TOKEN_EXPIRY_REMEMBERED : process.env.REFRESH_TOKEN_EXPIRY_NORMAL;
        const refreshToken= jwt.sign(
            {user_id:user._id, role:user.role}, 
            process.env.REFRESH_TOKEN_SECRET, 
            {expiresIn: refreshTokenAge}
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV=="PRODUCTION",
            maxAge: tokenMaxAge,
            samesite: "strict",
        });

        console.log("refresh token created successfully => " + refreshToken);
    }catch(error){
        console.log("error setting the refresh token-> "+ error.message);
    }
}

const setAccessToken= async (req, res, user)=>{
    try{
        const accessToken= jwt.sign(
            {user_id:user._id, role:user.role}, 
            process.env.ACCESS_TOKEN_SECRET, 
            {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
            );

        if(req.cookies.accessToken)
            res.clearCookie("accessToken");

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV=="PRODUCTION",
            maxAge: process.env.ACCESS_TOKEN_EXPIRY,
            samesite: "Strict",
        });

        console.log("access token created successfully => " + accessToken);
    }catch(error){
        console.log("error setting the access token-> "+ error.message);
    }
}

module.exports= {setAccessRefreshTokens, setAccessToken};