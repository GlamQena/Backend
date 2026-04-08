const jwt= require("jsonwebtoken");

const checkAuth= async(req, res, next)=>{
    let token;
    const headerAuth=req.headers.authorization || req.headers.Authorization
    if( headerAuth && headerAuth.startsWith("Bearer"))
        token= headerAuth.split(" ")[1];
    else if(req.headers.token)
        token= req.headers.token
    else
        token= req.cookies.accessToken;
    //consider the token come as a header prop or cookie from postman or with Authorization from frontend 'Bearer [token]'.

    if(!token)
        return res.status(401).json({message: "you're not authorized, please login first!"});

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedToken)=>{
        if(err){
            return res.status(401).json({message: `error decoding the access token-> ${err}`});
        }

        console.log("decoded token => ", decodedToken);

        const role= decodedToken.role;
        const id= decodedToken.user_id;

        req.user = {id, role};

        next();
    });
}

module.exports= checkAuth;