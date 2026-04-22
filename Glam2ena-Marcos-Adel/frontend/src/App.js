import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// استيراد الصفحات من الفولدرات الخاصة بها
import Home from "./pages/Home/Home";
import About from "./pages/About/AboutUs";
import Contact from "./pages/Contact/ContactUs";
import StoreProducts from "./pages/StoreProducts/Store";
import Cart from "./pages/Cart/Cart";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./components/ThemeProvider";
import VerificationCheck from "./pages/Verification/Check";
import Profile from "./pages/Profile/Profile";
import { closeTabHandler, logout } from "./services/authService";
import MyOrders from "./pages/MyOrders/MyOrders";

function App() {
  return (
      <BrowserRouter>
        <ThemeProvider>
          <Navbar></Navbar>
          <Routes>
            {/* الصفحات الرئيسية */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/store/products" element={<StoreProducts />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/my-orders" element={<MyOrders />} />

            {/* صفحات الحساب والدخول */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerificationCheck />} />
            <Route path="/profile" element={<Profile />} />

            {/* صفحة الداشبورد */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* مسار احتياطي في حال كتابة لينك غلط */}
            <Route path="*" element={<div>Page Not Found 404</div>} />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
  );
}

export default App;
