const morgan= require("morgan");

//set logs based on the environment
const applyLogger= (app)=>{
    if(process.env.NODE_ENV === "development")
        app.use(morgan("dev")); //Concise output colored by response status for development use
    else
        app.use(morgan("combined")); //Standard Apache combined log output.
}

module.exports= applyLogger;