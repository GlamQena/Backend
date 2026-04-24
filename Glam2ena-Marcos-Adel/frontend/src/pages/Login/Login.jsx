import "./Login.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  loginSchema,
  responseMessageSetter,
  login,
} from "../../services/authService";

const Login = () => {
  const navigate = useNavigate();

  // إظهإر او اخفاء الباسورد
  const [showPassword, setShowPassword] = useState(false);

  const [submitMessage, setSubmitMessage] = useState({
    success: false,
    message: "",
  });

  let {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { usernameOrEmail: "", password: "" },
    mode: "onChange",
  });

  const onSubmit = async (formData) => {
    console.log("form data-> ", formData);

    const bodyData = {
      usernameOrEmail: formData.usernameOrEmail,
      password: formData.password,
    };
    console.log("data to be sent-> ", bodyData);

    try {
      const response = await login(bodyData);
      const data = await response.json();

      if (response.ok) {
        console.log(data);
        const user = data.user;
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        responseMessageSetter(true, data.message, setSubmitMessage);

        if (user.role === "client") navigate("/");
        else navigate("/dashboard");
      } else {
        responseMessageSetter(false, data.message, setSubmitMessage);
      }
    } catch (error) {
      responseMessageSetter(false, error.message, setSubmitMessage);
    }
  };

  return (
    <div className="container">
      <div className="login-header">
        <h2>مرحباً بك في Glam Qena</h2>
        <p className="hint">سجل دخولك أو أنشئ حساب جديد</p>
      </div>
      <div className="login-card">
        {/* أزرار التبديل بين دخول وحساب جديد */}
        <div className="tabs-container">
          <button className="tab-btn active">تسجيل دخول</button>
          <button className="tab-btn" onClick={() => navigate("/register")}>
            حساب جديد
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {submitMessage.message && (
            <p
              className={`submit-message ${submitMessage.success ? "success-message" : "error-message"}`}
            >
              {submitMessage.message}
            </p>
          )}

          <div className="form-group">
            <label>
              اسم المستخدم أو البريد الإلكتروني{" "}
              <span className="required-star">*</span>
            </label>
            <input
              type="text"
              name="usernameOrEmail"
              className={errors.usernameOrEmail?.message ? "error" : ""}
              placeholder="اسم المستخدم أو البريد الإلكتروني"
              {...register("usernameOrEmail")}
            />
            {errors.usernameOrEmail?.message && (
              <p className="field-error">{errors.usernameOrEmail?.message}</p>
            )}
          </div>

          <div className="form-group">
            <label>
              كلمة المرور <span className="required-star">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className={errors.password?.message ? "error" : ""}
                placeholder="........"
                {...register("password")}
              />
              <button
                type="button"
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password?.message && (
              <p className="field-error">{errors.password?.message}</p>
            )}
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="rememberMe"
                {...register("rememberMe")}
              />
              تذكرني (لمدة 30 يوماً)
            </label>
            {/* اللينك اللى بيربط ب الريسيت  */}
            <Link
              to="/reset-password"
              name="reset-password-link"
              className="forgot-password"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>

          <button type="submit" className="submit-btn">
            تسجيل الدخول &larr; {/* html character for left arrow icon*/}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
