const path= require("path");
require("dotenv").config({path: path.join(__dirname, "../.env")});
const jwt= require("jsonwebtoken");


const setAccessRefreshTokens= (res, user, rememberMe=false)=>{
    try{
        const accessToken= setAccessToken(res, user);

       const refreshTokenMaxAge= rememberMe? parseInt(process.env.REFRESH_TOKEN_REMEMBERED_MS) : parseInt(process.env.REFRESH_TOKEN_NORMAL_MS);
        const refreshTokenExpiry= rememberMe? process.env.REFRESH_TOKEN_EXPIRY_REMEMBERED : process.env.REFRESH_TOKEN_EXPIRY_NORMAL;

        const refreshToken= jwt.sign(
            {user_id:user._id, role:user.role}, 
            process.env.REFRESH_TOKEN_SECRET, 
            {expiresIn: refreshTokenExpiry}
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV=="PRODUCTION",
            maxAge: refreshTokenMaxAge,
            sameSite: "lax",
            path: "/",
        });

        console.log("refresh token created successfully => " + refreshToken);
        return {accessToken, refreshToken};
    }catch(error){
        console.log("error setting the refresh token-> "+ error.message);
        return null;
    }
}

const setAccessToken= (res, user)=>{
    try{
        const accessToken= jwt.sign(
            {user_id:user._id, role:user.role}, 
            process.env.ACCESS_TOKEN_SECRET, 
            {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
            );

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV=="PRODUCTION",
            maxAge: parseInt(process.env.ACCESS_TOKEN_MS),
            sameSite: "lax",
            path: "/",
        });

        console.log("access token created successfully => " + accessToken);
        return accessToken;
    }catch(error){
        console.log("error setting the access token-> "+ error.message);
        return null;
    }
}

module.exports= {setAccessRefreshTokens, setAccessToken};