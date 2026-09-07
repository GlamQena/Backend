const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const cookie_parser = require("cookie-parser");
const { LOCAL_IP, getCorsOrigin } = require("./config/serverConfig.js");
const connect_mongodb = require("./config/connectMongoDB.js");
const { connect_redis } = require("./config/connectRedis");
const applySecurity = require("./middleware/applySecurity.js");
const applyLogger = require("./middleware/logger.js");
const mongoose = require("mongoose");
const authRouter = require("./router/auth.js");
const profileRouter = require("./router/profile.js");
const orderRouter = require("./router/order.js");
const productsRouter = require("./router/products.js");
const storesRouter = require("./router/stores.js");
const categoriesRouter = require("./router/categories.js");
const cartRouter = require("./router/cart.js");
const usersRouter = require("./router/users.js");
const adminRouter = require("./router/admin.js");
const userModel = require("./models/users/user.js");
const productModel = require("./models/product.js");
const categoryModel = require("./models/category.js");
const reviewModel = require("./models/review.js");
const ActivationFactory = require("./factories/activation.js");
const checkAuth = require("./middleware/checkAuth.js");
const { adminModel } = require("./models/users/admin.js");
const { clientModel } = require("./models/users/client.js");
const { storeOwnerModel } = require("./models/users/storeOwner.js");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(express.static(path.join(__dirname, "uploads")));

// CORS with dynamic origin validation
app.use(
  cors({
    origin: getCorsOrigin, // Use the function
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'Origin',
      'X-Requested-With',
      'Cookie'
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  })
);

app.use(cookie_parser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
      domain: process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined,
      path: "/",
    },
  })
);

// Routes
app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/stores", storesRouter);
app.use("/categories", categoriesRouter);
app.use("/products", productsRouter);
app.use("/order", orderRouter);
app.use("/cart", cartRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter);

app.use(express.json());

// Activation endpoint
const activableModels = {
  clients: {
    model: clientModel,
    modelName: "client",
    allowedRoles: ["admin"],
    requiredPermission: "manageUsers",
  },
  store_owners: {
    model: storeOwnerModel,
    modelName: "store_owner",
    allowedRoles: ["admin"],
    requiredPermission: "manageStores",
  },
  admins: {
    model: adminModel,
    modelName: "admin",
    allowedRoles: ["admin"],
    requiredPermission: "manageAdmins",
  },
  products: {
    model: productModel,
    modelName: "product",
    allowedRoles: ["admin", "store_owner"],
    requiredPermission: "manageProducts",
  },
  categories: {
    model: categoryModel,
    modelName: "category",
    allowedRoles: ["admin"],
    requiredPermission: "manageCategories",
  },
};

const activationHandler = ActivationFactory(activableModels);
app.patch("/:entity/:id/activation", checkAuth(), activationHandler);

// MongoDB connection
connect_mongodb();

mongoose.connection.once("connected", async () => {
  console.log("Server connected to MongoDB successfully...");
  // await connect_redis();

  // if (require.main === module) {
  //   const PORT = process.env.BACKEND_PORT || 8080;
  //   const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0'; // Keep 0.0.0.0 for mobile

  //   app.listen(PORT, HOST, (err) => {
  //     if (err) {
  //       console.error(`Error listening on port ${PORT}:`, err);
  //     } else {
  //       console.log(`Express server listening:`);
  //       console.log(`   - Local:   http://localhost:${PORT}`);
  //       console.log(`   - Network: http://${LOCAL_IP}:${PORT}`);
  //       console.log(`   - Mobile:  http://${LOCAL_IP}:${PORT} (use this on your phone)`);
  //       console.log(`   - Mode:    ${process.env.NODE_ENV || 'development'}`);
  //     }
  //   });
  // }
});

mongoose.connection.on("error", (err) => {
  console.error(`Error connecting to MongoDB: ${err}`);
});

module.exports = app;