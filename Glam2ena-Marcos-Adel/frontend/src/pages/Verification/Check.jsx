import React, {useState, useEffect, useRef} from 'react';
import {useNavigate} from "react-router-dom";
import './Check.css';
import Verified from './Success';

const VerificationCheck = () => {
    const navigate= useNavigate();
    const [checkMessage, setCheckMessage]= useState({success: false, message:""});
    const [isVerified, setIsVerified]= useState(false);
    const timerRef= useRef(null);

    const urlParams= new URLSearchParams(window.location.search); //gets the query params
    const email= urlParams.get("email");
    const token= urlParams.get("token");

    console.log("email-> ", email);
    console.log("token-> ", token);

    useEffect(()=>{
        if(!email || !token)
            return setCheckMessage({success: false, message: "email and token must be provided"});

        verifyEmail();
        return ()=>{
            if(timerRef.current)
                clearTimeout(timerRef.current);
        }
    }
    , [email, token]);

    const verifyEmail= async()=>{
        try{
            const response= await fetch(`http://127.0.0.1:8080/auth/verify/${email}/${token}`);
            const data= await response.json();
            if(!response.ok)
                return setCheckMessage({success: false, message: data.message});

            setCheckMessage({success: true, message: data.message});
            setIsVerified(true);
            const user= data.user;
            localStorage.setItem("user", JSON.stringify(user));

            timerRef.current = setTimeout(()=>{
              if(user.role === "client")
                navigate("/");
              else
                navigate("/dashboard");
            }, 4000);

        }catch(error){
            setCheckMessage({success: false, message: error.message});
        }
    }

    const resendToken= async()=> {
        try{
            const response= await fetch("http://127.0.0.1:8080/auth/email/send-token",{
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email})
            });
            const data= await response.json();

            if(!response.ok)
                return setCheckMessage({success:false, message:data.message}); 

            setCheckMessage({success:true, message:data.message});
        }catch(error){
            setCheckMessage({success:false, message:error.message}); 
        }
    }

    useEffect(()=>{
        if(checkMessage.message)
            setTimeout(()=>{
                setCheckMessage({success: false, message:""});
            }, 4000);
    }, [checkMessage.message]);

  return (
    !isVerified?
    <div className="verification-container" dir="rtl">
      <div className="verification-card">
        <div className="verification-icon">
          <div className="icon-circle">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 12V8H4V12M20 12L12 16L4 12M20 12L12 8M4 12L12 8M12 8V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        <h1 className="verification-title">جاري التحقق من بريدك</h1>
        
        <p className="verification-text">
          لتحقق من الرابط الخاص بك. قد يستغرق ذلك بضع ثوان ...
        </p>
        
        {checkMessage.message && <p className="error-message">{checkMessage.message}</p>}

        <div className="verification-action">
          <span className="action-text">لم يتم التحويل؟</span>
          <a href="#" className="retry-link" onClick={verifyEmail}>إعادة المحاولة</a>
        </div>
        
        <div className="resend-section">
          <span className="resend-label">لم يصلك رابط التحقق ؟</span>
          <a href="#" className="resend-link" onClick={resendToken}>إعادة ارسال</a>
        </div>
      </div>
    </div>
    :
    <Verified/>
  );
};

export default VerificationCheck;