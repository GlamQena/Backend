const path= require("path");
require("dotenv").config({path: path.join(__dirname, "../.env")});
const jwt= require("jsonwebtoken");

const setAccessRefreshTokens= async (res, user, rememberMe)=>{

    setAccessToken(res, user);

    const refreshTokenAge= rememberMe? process.env.REFRESH_TOKEN_EXPIRY_REMEMBERED : process.env.REFRESH_TOKEN_EXPIRY_NORMAL;
    const refreshToken= jwt.sign(
        {user_id:user._id, role:user.role}, 
        process.env.REFRESH_TOKEN_SECRET, 
        {expiresIn: refreshTokenAge}
    );

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV=="PRODUCTION",
        maxAge: refreshTokenAge,
        samesite: "strict",
    });

    console.log("refresh token created successfully => " + accessToken);
}

const setAccessToken= async (req, res, user)=>{

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
        samesite: "strict",
    });

    console.log("access token created successfully => " + accessToken);
}

module.exports= {setAccessRefreshTokens, setAccessToken};