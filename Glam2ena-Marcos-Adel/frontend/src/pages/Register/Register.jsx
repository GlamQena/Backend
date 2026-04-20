import { useState } from "react";
import { useForm } from "react-hook-form";
import {useNavigate} from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  User,
  Store,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Calendar,
  MapPin,
  Venus,
  Mars,
  VenusAndMars,
  Eye,
  EyeOff,
  Building2,
  MapPinned,
} from "lucide-react";
import { registerUser, formMessageSetter, clientSchema, storeOwnerSchema, } from "../../services/authService";
import "./Register.css";

const Register = () => {
  const navigate= useNavigate();
  const [selectedRole, setSelectedRole] = useState("client");
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({success: false, message: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get the appropriate schema based on selected role
  const getCurrentSchema = () => {
    return selectedRole === "client" ? clientSchema : storeOwnerSchema;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues
  } = useForm({
    resolver: yupResolver(getCurrentSchema()),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      birthdate: "",
      gender: "",
      address: {
        city: "",
        district: "",
        street: "",
      },
      store_name: "",
      store_email: "",
      store_phone: "",
      store_address: {
        city: "",
        district: "",
        street: "",
      },
    },
    mode: "onChange"
  });

  // Handle role change
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Clear errors when switching roles
    formMessageSetter(false, "" , setSubmitMessage);
  };

  // Handle gender selection
  const handleGenderSelect = (gender) => {
    setValue("gender", gender, { shouldValidate: true });
  };

  // Handle address field changes
  const handleAddressChange = (field, value) => {
    setValue(`address.${field}`, value, { shouldValidate: true });
  };

  // Handle store address field changes
  const handleStoreAddressChange = (field, value) => {
    setValue(`store_address.${field}`, value, { shouldValidate: true });
  };

  // Handle regular input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValue(name, value, { shouldValidate: true });
  };

  // Form submission handler
  const onSubmit = async (formData) => {
    setLoading(true);
    formMessageSetter(false, "" , setSubmitMessage);

    try {
      // Prepare data for API
      const registrationData = {
        role: selectedRole,
        username: formData.username.toLowerCase().trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone || undefined,
        birthdate: formData.birthdate || undefined,
        gender: formData.gender || undefined,
        address: (formData.address?.city || formData.address?.district || formData.address?.street)
          ? {
              city: formData.address.city || undefined,
              district: formData.address.district || undefined,
              street: formData.address.street || undefined,
            }
          : undefined,
      };

      // Add store owner specific data
      if (selectedRole === "store_owner") {
        registrationData.store_name = formData.store_name;
        registrationData.store_email = formData.store_email.toLowerCase().trim();
        registrationData.store_phone = formData.store_phone;
        registrationData.store_address = {
          city: formData.store_address.city,
          district: formData.store_address.district,
          street: formData.store_address.street,
        };
      }

      console.log("Sending data:", registrationData);
      const responseData = await registerUser(registrationData);
      
      window.scrollTo({ top: 0, behavior: "smooth" });
      formMessageSetter(true,
        responseData.message || "تم إرسال رابط التفعيل إلى بريدك الإلكتروني",
        setSubmitMessage
      );

      localStorage.setItem("user", JSON.stringify(responseData.user));
      localStorage.setItem("accessToken", responseData.accessToken);
      localStorage.setItem("refreshToken", responseData.refreshToken);

      if(responseData.user.role === "client")
          navigate("/")
      else
          navigate("/dashboard");
    } catch (err) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      console.error("Registration error:", err);
      formMessageSetter(false,
        err.message || "حدث خطأ أثناء التسجيل",
        setSubmitMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="container">
      <div className="role-selection">
        <button
          className={`role-btn client ${selectedRole === "client" ? "active" : ""}`}
          onClick={() => handleRoleSelect("client")}
          type="button"
          tabIndex={0}
        >
          عميل
        </button>

        <button
          className={`role-btn owner ${selectedRole === "store_owner" ? "active" : ""}`}
          onClick={() => handleRoleSelect("store_owner")}
          type="button"
          tabIndex={0}
        >
          صاحب محل
        </button>
      </div>

      <div className="registration-form-container">
        <div className="form-header">
          <div className={`role-indicator ${selectedRole}`}>
            {selectedRole === "client" ? (
              <>
                <User size={24} />
                <span>
                  تسجيل كـ <strong>عميل</strong>
                </span>
              </>
            ) : (
              <>
                <Store size={24} />
                <span>
                  تسجيل كـ <strong>صاحب محل</strong>
                </span>
              </>
            )}
          </div>
          <h2>أنشئ حسابك الجديد</h2>
        </div>

        {submitMessage.message && (
          <div className={`${submitMessage.success ? "success-message" : "error-message"}`}>
            {submitMessage.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="registration-form">
          {/* Username Field */}
          <div className="form-group">
            <label>
              <UserIcon size={18} /> اسم المستخدم{" "}
              <span className="required-star">*</span>
            </label>
            <input
              type="text"
              name="username"
              {...register("username")}
              onChange={handleInputChange}
              placeholder="أدخل اسم المستخدم (أحرف إنجليزية صغيرة)"
              disabled={loading}
              className={errors.username ? "error" : ""}
            />
            {errors.username && (
              <span className="field-error">{errors.username.message}</span>
            )}
            <small className="field-hint">
              يمكن استخدام الأحرف الإنجليزية الصغيرة والأرقام والشرطة السفلية فقط
            </small>
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label>
              <Mail size={18} /> البريد الإلكتروني{" "}
              <span className="required-star">*</span>
            </label>
            <input
              type="email"
              name="email"
              {...register("email")}
              onChange={handleInputChange}
              placeholder="example@domain.com"
              disabled={loading}
              className={errors.email ? "error" : ""}
            />
            {errors.email && (
              <span className="field-error">{errors.email.message}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label>
              <Lock size={18} /> كلمة المرور{" "}
              <span className="required-star">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                {...register("password")}
                onChange={handleInputChange}
                placeholder="٨ أحرف على الأقل"
                disabled={loading}
                className={errors.password ? "error" : ""}
              />
              <button
                type="button"
                className="eye-icon"
                onClick={() => togglePasswordVisibility("password")}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <span className="field-error">{errors.password.message}</span>
            )}
            <small className="field-hint">
              يجب أن تحتوي على حرف كبير وحرف صغير ورقم على الأقل
            </small>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label>
              <Lock size={18} /> تأكيد كلمة المرور{" "}
              <span className="required-star">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                {...register("confirmPassword")}
                onChange={handleInputChange}
                placeholder="أعد إدخال كلمة المرور"
                disabled={loading}
                className={errors.confirmPassword ? "error" : ""}
              />
              <button
                type="button"
                className="eye-icon"
                onClick={() => togglePasswordVisibility("confirm")}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword.message}</span>
            )}
          </div>

          {/* Phone Field */}
          <div className="form-group">
            <label>
              <Phone size={18} /> رقم الهاتف{" "}
            </label>
            <input
              type="tel"
              name="phone"
              {...register("phone")}
              onChange={handleInputChange}
              placeholder="مثال: 01234567890"
              disabled={loading}
              className={errors.phone ? "error" : ""}
            />
            {errors.phone && (
              <span className="field-error">{errors.phone.message}</span>
            )}
            <small className="field-hint">
              رقم مصري صحيح (010, 011, 012, 015 ثم 8 أرقام)
            </small>
          </div>

          {/* Birthdate Field */}
          <div className="form-group">
            <label>
              <Calendar size={18} /> تاريخ الميلاد
            </label>
            <input
              type="date"
              name="birthdate"
              {...register("birthdate")}
              onChange={handleInputChange}
              disabled={loading}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Gender Selection */}
          <div className="form-group">
            <label>
              <VenusAndMars size={18} /> الجنس
            </label>
            <div className="gender-buttons">
              <button
                type="button"
                className={`gender-btn ${getValues("gender") === "male" ? "active" : ""}`}
                onClick={() => handleGenderSelect("male")}
              >
                <Mars size={20} />
                <span>ذكر</span>
              </button>
              <button
                type="button"
                className={`gender-btn ${getValues("gender") === "female" ? "active" : ""}`}
                onClick={() => handleGenderSelect("female")}
              >
                <Venus size={20} />
                <span>أنثى</span>
              </button>
            </div>
            {errors.gender && (
              <span className="field-error">{errors.gender.message}</span>
            )}
          </div>

          {/* Optional Address Section */}
          <div className="form-section-divider">
            <span>
              <MapPin size={16} /> العنوان (اختياري)
            </span>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>
                <Building2 size={18} /> المدينة
              </label>
              <input
                type="text"
                name="address.city"
                value={getValues("address.city") || ""}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                placeholder="المدينة"
                disabled={loading}
                className={errors.address?.city ? "error" : ""}
              />
              {errors.address?.city && (
                <span className="field-error">{errors.address.city.message}</span>
              )}
            </div>

            <div className="form-group half">
              <label>
                <MapPinned size={18} /> المنطقة
              </label>
              <input
                type="text"
                name="address.district"
                value={getValues("address.district") || ""}
                onChange={(e) => handleAddressChange("district", e.target.value)}
                placeholder="المنطقة"
                disabled={loading}
                className={errors.address?.district ? "error" : ""}
              />
              {errors.address?.district && (
                <span className="field-error">{errors.address.district.message}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>
              <MapPin size={18} /> الشارع
            </label>
            <input
              type="text"
              name="address.street"
              value={getValues("address.street") || ""}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              placeholder="الشارع"
              disabled={loading}
              className={errors.address?.street ? "error" : ""}
            />
            {errors.address?.street && (
              <span className="field-error">{errors.address.street.message}</span>
            )}
          </div>

          {/* Store Owner Specific Fields */}
          {selectedRole === "store_owner" && (
            <>
              <div className="form-section-divider">
                <span>
                  <Store size={16} /> معلومات المحل
                </span>
              </div>

              <div className="form-group">
                <label>
                  <Store size={18} /> اسم المحل{" "}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="store_name"
                  {...register("store_name")}
                  onChange={handleInputChange}
                  placeholder="أدخل اسم المحل"
                  disabled={loading}
                  className={errors.store_name ? "error" : ""}
                />
                {errors.store_name && (
                  <span className="field-error">{errors.store_name.message}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Mail size={18} /> البريد الإلكتروني للمحل{" "}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="email"
                  name="store_email"
                  {...register("store_email")}
                  onChange={handleInputChange}
                  placeholder="store@example.com"
                  disabled={loading}
                  className={errors.store_email ? "error" : ""}
                />
                {errors.store_email && (
                  <span className="field-error">{errors.store_email.message}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Phone size={18} /> هاتف المحل{" "}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="tel"
                  name="store_phone"
                  {...register("store_phone")}
                  onChange={handleInputChange}
                  placeholder="مثال: 01234567890"
                  disabled={loading}
                  className={errors.store_phone ? "error" : ""}
                />
                {errors.store_phone && (
                  <span className="field-error">{errors.store_phone.message}</span>
                )}
                <small className="field-hint">
                  رقم مصري صحيح (010, 011, 012, 015 ثم 8 أرقام)
                </small>
              </div>

              {/* Store Address - Required */}
              <div className="form-section-divider">
                <span>
                  <MapPin size={16} /> عنوان المحل{" "}
                  <span className="required-star">*</span>
                </span>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>
                    <Building2 size={18} /> المدينة{" "}
                    <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="store_address.city"
                    value={getValues("store_address.city") || ""}
                    onChange={(e) => handleStoreAddressChange("city", e.target.value)}
                    placeholder="مدينة المحل"
                    disabled={loading}
                    className={errors.store_address?.city ? "error" : ""}
                  />
                  {errors.store_address?.city && (
                    <span className="field-error">{errors.store_address.city.message}</span>
                  )}
                </div>

                <div className="form-group half">
                  <label>
                    <MapPinned size={18} /> المنطقة{" "}
                    <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="store_address.district"
                    value={getValues("store_address.district") || ""}
                    onChange={(e) => handleStoreAddressChange("district", e.target.value)}
                    placeholder="منطقة المحل"
                    disabled={loading}
                    className={errors.store_address?.district ? "error" : ""}
                  />
                  {errors.store_address?.district && (
                    <span className="field-error">{errors.store_address.district.message}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={18} /> الشارع{" "}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="store_address.street"
                  value={getValues("store_address.street") || ""}
                  onChange={(e) => handleStoreAddressChange("street", e.target.value)}
                  placeholder="شارع المحل"
                  disabled={loading}
                  className={errors.store_address?.street ? "error" : ""}
                />
                {errors.store_address?.street && (
                  <span className="field-error">{errors.store_address.street.message}</span>
                )}
              </div>
            </>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
          </button>

          <p className="login-link">
            لديك حساب بالفعل؟ <a href="/login">تسجيل الدخول</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;