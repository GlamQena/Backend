import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// استيراد الصفحات من الفولدرات الخاصة بها
import Home from './pages/Home/Home';
import About from './pages/About/AboutUs';
import Contact from './pages/Contact/ContactUs';
import Products from './pages/Products/Products';
import Cart from './pages/Cart/Cart';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Login/Login';
import LoginClient from './pages/Login/LoginClient/LoginClient';
import LoginOwner from './pages/Login/LoginOwner/LoginOwner'; // تأكدي من اسم الملف داخل فولدر Login
import Register from './pages/Register/Register';
import ResetPassword from './pages/ResetPassword/ResetPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* الصفحات الرئيسية */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        
        {/* صفحات الحساب والدخول */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/login-client" element={<LoginClient />} />
        <Route path="/login/login-owner" element={<LoginOwner />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* صفحة الداشبورد */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* مسار احتياطي في حال كتابة لينك غلط */}
        <Route path="*" element={<div>Page Not Found 404</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;