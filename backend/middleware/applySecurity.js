const rate_limit= require("express-rate-limit");
const mongoSanitizer= require("express-mongo-sanitize");
const helmet= require("helmet");

const applySecurity= (app)=>{
    //securing the header for each request
    app.use(helmet());

    //prevent brute force attack
    const limiter= rate_limit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS), //.env variables by default acted as a string.
        max: Number(process.env.RATE_LIMIT_MAX_REQUESTS), //requests max num
        message: "too many requests, try again later",
        validate: true,
    });

    app.use("/auth", limiter); 
    //for auth path where the user can access many requests if he counter error messages 

    //use mongo sanitizing to prevent noSQL injection
    app.use((req, res, next)=>{
        if(req.body)
            mongoSanitizer.sanitize(req.body, {replaceWith: '_'});
        if(req.query)
            mongoSanitizer.sanitize(req.query);
        if(req.params)
            mongoSanitizer.sanitize(req.params);
        next();
    });

    // app.use(mongoSanitizer()); //default sanitizing the objects with keys marked with $ or contain dot.
}

module.exports= applySecurity;