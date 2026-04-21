const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const cookie_parser = require("cookie-parser");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, ".env") });

// 🔥 اطبع القيم هنا
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("BACKEND_PORT:", process.env.BACKEND_PORT);
console.log("SESSION_SECRET:", process.env.SESSION_SECRET);

const connect_mongodb = require("./config/connectMongoDB.js");
const { connect_redis } = require("./config/connectRedis");

const authRouter = require("./router/auth.js");
const profileRouter = require("./router/profile.js");
const orderRouter = require("./router/order.js");
const productsRouter = require("./router/products.js");
const storesRouter = require("./router/stores.js");
const categoriesRouter = require("./router/categories.js");
const usersRouter = require("./router/users.js");
const cartRouter = require("./router/cart.js");

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "uploads")));

// CORS
const allowedOrigins = [
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://localhost:3000",
  "http://192.168.1.100:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("this origin not allowed by cors!"), false);
      }
    },
    credentials: true,
  })
);

app.use(cookie_parser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

// routes
app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/users", usersRouter);
app.use("/stores", storesRouter);
app.use("/categories", categoriesRouter);
app.use("/products", productsRouter);
app.use("/order", orderRouter);
app.use("/cart", cartRouter);

// 🔥 اتصال Mongo
connect_mongodb();

// start server بعد الاتصال
mongoose.connection.once("connected", async () => {
  console.log("✅ server connected to mongodb successfully...");

  app.listen(process.env.BACKEND_PORT || 8080, () => {
    console.log(
      `🚀 express server listening on port -> ${
        process.env.BACKEND_PORT || 8080
      }`
    );
  });
});

mongoose.connection.on("error", (err) => {
  console.error("❌ error connecting to mongodb ->", err.message);
});