import axios from "axios";
import * as yup from "yup";

const API_URL = "http://localhost:8080/auth";
export const isUserLogged = () => {
  const user = localStorage.getItem("user");
  if(!user || user === "undefined" || Object.keys(user) === 0)
    return false;
  return true;
}

export const registerUser = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/register`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const login = async (data) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    });

    return response;
  }catch(error){
    throw error //throw instead of just return for the error to be handled with try-catch
  }
};

export const sendOtp = async (data) => {
  try {
    const response = await fetch(`${API_URL}/password/send-otp`, 
    {method: "POST", headers:{"Content-Type": "application/json"}, 
    body: JSON.stringify(data)});

    return response;
  }catch(error){
    throw error
  }
}

export const verifyOtp = async (data) => {
  try {
    const response = await fetch(`${API_URL}/password/verify-otp`, 
    {method: "POST", headers:{"Content-Type": "application/json"}, 
    body: JSON.stringify(data)});

    return response;
  }catch(error){
    throw error
  }
}

export const resetPassword = async (data) => {
  try {
    const response = await fetch(`${API_URL}/password/reset`, {
         method: "POST",
         headers:{"Content-Type": "application/json"}, 
         body: JSON.stringify(data)
        });

    return response;
  }catch(error){
    throw error
  }
}

export const logout = async () => {
  try {
    const session_id= sessionStorage.getItem("session_id");

    const response = await fetch(`${API_URL}/logout${session_id? `?session_id=${session_id}`: ""}`, {method: "DELETE"});

    const logoutData= await response.json();
    if(!response.ok)
        console.error(logoutData.message);
    console.log(logoutData.message)
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    window.location.reload();
  }catch(error){
    throw error
  }
};

export const getAccessToken= async(setFormMessage)=>{
  try{
      let accessToken= localStorage.getItem("accessToken");
      if(!accessToken){
          formMessageSetter(false, "please login first", setFormMessage);
          return null;
      }

      const decodedAccessToken= JSON.parse(atob(accessToken.split(".")[1]));
      //atob is a global javaScript method for decoding (ASCII to binary)

      if(decodedAccessToken.exp*1000 < Date.now()){
          const response= await fetch(`${API_URL}/refresh-token`, 
              {
                  credentials: "include",
                  headers:{
                  "Authorization": `Bearer ${localStorage.getItem("refreshToken")}`,
                  "Content-Type": "application/json",
              }});
          const refreshData= await response.json();
          console.log("refresh token response => ", refreshData);
          if(refreshData.message.includes("expired")){
              formMessageSetter(false, "your session ended, please login", setFormMessage);
              return null;
          }
          else if(!response.ok){
              formMessageSetter(false, refreshData.message, setFormMessage);
              return null;
          }
          else{
              localStorage.setItem("user", JSON.stringify(refreshData.user));
              localStorage.setItem("accessToken", refreshData.accessToken);
              accessToken= refreshData.accessToken;
          }
      }
      return accessToken;

  }catch(error){
      formMessageSetter(false, "your session ended, please login", setFormMessage);
      return null;
  }
}

export function formMessageSetter(success, message, setFormMessage){
    setFormMessage({success, message});
    setTimeout(()=>{
        setFormMessage({success: false, message: ""});
    }, 6000);
}

export function closeTabHandler(){
  window.removeEventListener("beforeunload", beforeUnloadHandler);
  window.addEventListener("beforeunload", beforeUnloadHandler);
} //doesn't called properly

const beforeUnloadHandler= async ()=>{
  await logout();
}

const passwordField= yup.string().required("كلمة المرور مطلوبة")
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .max(64, "كلمة المرور يجب ألا تتجاوز 64 حرف")
      .matches(/[A-Z]/, "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
      .matches(/[a-z]/, "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل")
      .matches(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")

export const emailField= yup.string().email().required("يرجى إدخال الإيميل").max(254, "البريد الإلكتروني يجب ألا يتجاوز 254 حرف");

// Define validation schemas
export const loginSchema = yup.object({
  "usernameOrEmail": yup.string()
    .required("يرجى إدخال اسم المستخدم أو البريد الإلكتروني")
    .test("usernameOrEmail", "صيغة غير صالحة!", function(value) {
      if (value.includes("@")) {
        // Email validation
        if (value.length > 254)
          return this.createError({ message: "البريد الإلكتروني يجب ألا يتجاوز 254 حرف" });

        const isValid = yup.string().email().isValidSync(value);
        if (!isValid) {
          return this.createError({ 
            message: "يرجى إدخال بريد إلكتروني صالح" 
          });
        }
        return true;
      } else {
        // Username validation
        if (value.length < 3) {
          return this.createError({ 
            message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" 
          });
        }
        if (value.length > 64) {
          return this.createError({ 
            message: "اسم المستخدم لا يمكن أن يتجاوز 64 حرف" 
          });
        }
        if (!/^[a-z0-9_]+$/.test(value)) {
          return this.createError({ 
            message: "اسم المستخدم يمكن أن يحتوي فقط على أحرف صغيرة وأرقام وشرطة سفلية" 
          });
        }
        return true;
      }
    }),
  "password": passwordField,
  "rememberMe": yup.boolean()
});

export const commonFieldsSchema = {
  username: yup.string()
    .required("اسم المستخدم مطلوب")
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .max(64, "اسم المستخدم يجب أن يكون أقل من 64 حرف")
    .matches(/^[a-z0-9_]+$/, "اسم المستخدم يمكن أن يحتوي فقط على أحرف إنجليزية صغيرة وأرقام وشرطة سفلية"),
  
  email: yup.string()
    .required("البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح")
    .max(254, "البريد الإلكتروني طويل جداً"),
  
  password: passwordField, // Assuming this is defined in authService
  
  confirmPassword: yup.string()
    .required("تأكيد كلمة المرور مطلوب")
    .oneOf([yup.ref("password")], "كلمة المرور غير متطابقة"),
  
  phone: yup.string()
    .notRequired()
    .transform(value =>  value?.trim() === "" ? null : value)
    .matches(/^01[0125][0-9]{8}$/, "رقم الهاتف غير صالح (يجب أن يبدأ بـ 010, 011, 012, 015 ثم 8 أرقام)"),
  
  gender: yup.string()
    .nullable()
    .optional()
    .transform(value => !value ?  null : value)
    .oneOf(["male", "female"], "الجنس يجب أن يكون ذكر أو أنثى"),
  
  birthdate: yup.string().nullable().optional(),
  
  address: yup.object({
    city: yup.string().max(50, "اسم المدينة يجب أن يكون أقل من 50 حرف").optional(),
    district: yup.string().max(50, "اسم المنطقة يجب أن يكون أقل من 50 حرف").optional(),
    street: yup.string().max(100, "اسم الشارع يجب أن يكون أقل من 100 حرف").optional(),
  }).optional()
};

export const clientSchema = yup.object(commonFieldsSchema);

export const storeOwnerSchema = yup.object({
  ...commonFieldsSchema,
  store_name: yup.string()
    .required("اسم المحل مطلوب")
    .max(100, "اسم المحل يجب أن يكون أقل من 100 حرف"),
  
  store_email: yup.string()
    .required("البريد الإلكتروني للمحل مطلوب")
    .email("البريد الإلكتروني للمحل غير صالح"),
  
  store_phone: yup.string()
    .required("رقم هاتف المحل مطلوب")
    .matches(/^01[0125][0-9]{8}$/, "رقم هاتف المحل غير صالح (يجب أن يبدأ بـ 010, 011, 012, 015 ثم 8 أرقام)"),
  
  store_address: yup.object({
    city: yup.string()
      .required("مدينة المحل مطلوبة")
      .max(50, "اسم المدينة يجب أن يكون أقل من 50 حرف"),
    district: yup.string()
      .required("منطقة المحل مطلوبة")
      .max(50, "اسم المنطقة يجب أن يكون أقل من 50 حرف"),
    street: yup.string()
      .required("شارع المحل مطلوب")
      .max(100, "اسم الشارع يجب أن يكون أقل من 100 حرف"),
  })
});

export const resetPasswordSchema= yup.object({
  "newPassword": passwordField,
  "confirmPassword": passwordField,
});