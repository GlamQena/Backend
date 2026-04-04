const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const cookie_parser = require("cookie-parser");
const connect_mongodb = require("./config/connectMongoDB.js");
const {connect_redis} = require("./config/connectRedis");
const applySecurity = require("./middleware/applySecurity.js");
const applyLogger = require("./middleware/logger.js");
const mongoose = require("mongoose");
const authRouter = require("./router/auth.js");
const profileRouter = require("./router/profile.js");
const orderRouter= require("./router/order.js");
const productsRouter= require("./router/products.js");
const storesRouter= require("./router/stores.js");
const usersRouter= require("./router/users.js");
const cartRouter= require("./router/products.js");

require("dotenv").config({ path: path.join(__dirname, "./env") });

const app = express();
app.use(express.json());

app.use( express.static(path.join(__dirname, 'uploads'))); //to allow access the photos in uploads folder


//enable cookies
const allowedOrigins = [
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://localhost:3000",
  "http://192.168.1.100:3000", //dev machine ip
]; //possible localhost origins

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        //if the request has no origin (e.g. mobile apps) or included in the allowed list,
        callback(null, true); //call the callback with no Error message and allow the origin
      else callback(new Error("this origin not allowed by cors!"), false);
    },
    credentials: true, //allow cookies
  }),
);

app.use(cookie_parser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, //httpOnly cookie means its related to the requests itself and can't be accessed by javaScript
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  }),
);

//routes
app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/order", orderRouter);
app.use("/products", productsRouter);
app.use("/stores", storesRouter);
app.use("/users", usersRouter);
app.use("/cart", cartRouter);


//mongodb connection
connect_mongodb();

mongoose.connection.once("connected", async () => {
  console.log("server connected to mongodb successfully...");
  // await connect_redis();

  app.listen(process.env.PORT, (err) => {
    if (err) {
      console.error(`error listening on port: ${process.env.PORT}!`);
    } else {
      console.log(`express server listening on port-> ${process.env.PORT}...`);
    }
  });
});

mongoose.connection.on("error", (err) => {
  console.error(`error connecting to mongodb-> ${err}`);
});
