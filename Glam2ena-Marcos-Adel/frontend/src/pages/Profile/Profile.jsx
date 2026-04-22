import React, {useState, useEffect} from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";
import { formMessageSetter, isUserLogged, logout } from "../../services/authService";
import { changePassword, deleteProfile, editProfile, editAvatar, getProfile } from "../../services/profileService";

//TODO=> yub validations schema for the edit form
const Profile= ()=>{
    const navigate= useNavigate();
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [profileForm, setProfileForm] = useState(null);
    const [avatarImg, setAvatarImg] = useState(null);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [formMessage, setFormMessage]= useState({success: false, message: ""});

    useEffect(()=>{
        loadUserData();
    }, [editMode]);

    const loadUserData= async ()=> {
        const user= localStorage.getItem("user");
        if(user && user !== "undefined" && user !== "null" && user !== ""){
            setProfileForm({...JSON.parse(user)});
            setLoading(false);
            console.log(profileForm);
        }
        else{
            localStorage.removeItem("user");
            await getUserProfile();
            console.log(profileForm);
        }
    }

    const getUserProfile= async()=>{
        try{
            const response= await getProfile(setFormMessage);
            const data= await response.json();

            if(!response.ok)
                formMessageSetter(false, data.message, setFormMessage);

            setProfileForm({...data.user});
            setLoading(false);
            localStorage.setItem("user", JSON.stringify(data.user));
            console.log(data.message);
        }catch(error){
            formMessageSetter(false, error.message, setFormMessage);
        }
    }

    const handleChangeInput = (e) => {
        let { name, value, type, checked } = e.target;
        if(type === "password")
            setPasswordForm(prev => ({...prev, [name]: value}));

        else if(type === "file"){
            const file = e.target.files[0];
            setAvatarImg(file);
        }

        else if (type === "checkbox"){
            let newNotifications= [...profileForm.notifications];
            
            if(newNotifications.includes(name))
                newNotifications= newNotifications.filter(not=>not!==name);
            else
                newNotifications.push(name);

            setProfileForm(prev => ({
                ...prev,
                notifications: newNotifications,
            }));
        }

        else if (name.includes("store_address")){
            name = name.split(".")[1];
            setProfileForm(prev => ({ ...prev, store_address: {...prev.store_address, [name]: value} }));
        }

        else if (name.includes("address")){
            name = name.split(".")[1];
            setProfileForm(prev => ({ ...prev, address: {...prev.address, [name]: value} }));
        }

        else 
            setProfileForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSelection = (field, value) => {

        if(typeof profileForm[field] === "object"){  //array selection like skinConcerns
            let newArr= [...profileForm[field]];

            if(newArr.includes(value))
                newArr= newArr.filter(val=> val !== value);
            else
                newArr.push(value);

            setProfileForm(prev => ({ ...prev, [field]: [...newArr] }));
        }
        else
            setProfileForm(prev => ({ ...prev, [field]: value }));
    };

    const handleChangePassword= async (e)=> {
        e.preventDefault();
        if (passwordForm.newPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
        formMessageSetter(false, "كلمة المرور غير متطابقة", setFormMessage);
        return;
        }

        try{
            const reqBody=JSON.stringify({
                    email: profileForm.email,
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                    confirmNewPassword: passwordForm.confirmPassword
                });

            const response= await changePassword(reqBody, setFormMessage);

            const data= await response.json();
            if(!response.ok)
                return formMessageSetter(false, data.message, setFormMessage);

            formMessageSetter(true, data.message, setFormMessage);

            setTimeout(()=>{
                navigate("/login");
            }, 6000);

        }catch(e){
            formMessageSetter(false, e.message, setFormMessage);
            console.error(e.error);
        }
    }

    const handleEditProfile = async (e) => {
        e.preventDefault();
        console.log("profile data=> ", profileForm, avatarImg);

        if (avatarImg && avatarImg instanceof File) {
            const imageFormData= new FormData();
            imageFormData.append('image', avatarImg);
            console.log('Appended image:', imageFormData.get("image").name);

            try{
                const response = await editAvatar(imageFormData, setFormMessage);

                const avatarResData= await response.json();
                if(!response.ok)
                    return formMessageSetter(false, avatarResData.message, setFormMessage);

                formMessageSetter(true, avatarResData.message, setFormMessage);

            }catch(error){
                formMessageSetter(false, error.message, setFormMessage);
            }
        }

        try {

            const res = await editProfile(profileForm, setFormMessage);

            const data= await res.json();

            if (res.ok) {
                formMessageSetter(true, data.message || "تم حفظ التعديلات بنجاح ", setFormMessage);
                localStorage.setItem("user", JSON.stringify(data.user));
                setEditMode(false);
            }
            else 
                formMessageSetter(false, data.message || "فشل التعديل", setFormMessage);

        } 
        catch (err) {
            formMessageSetter(false, err.message || "خطأ في الاتصال بالسيرفر", setFormMessage);
        }
    };

    const handleDeleteProfile = async () => {
        try {
        const res = await deleteProfile(setFormMessage);

        const data= await res.json();

        if (res.ok) {
            formMessageSetter(true,  data.message, setFormMessage);
            await logout();

            setTimeout(()=>{
                navigate("/");
            }, 6000);
        }
        else formMessageSetter(false,  data.message, setFormMessage);

        } catch (err) {
            formMessageSetter(false, "خطأ في الاتصال بالسيرفر", setFormMessage);
        }
    };

    if (!isUserLogged()) {
        return (
            <div className="profile-page-wrapper" dir="rtl">
                <div className="notAuth-message">
                    <p className="error-message">Your session ended, please login</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="profile-page-wrapper" dir="rtl">
                <div className="loading">جاري تحميل البيانات...</div>
            </div>
        );
    }

    if (!profileForm) {
        return (
            <div className="profile-page-wrapper" dir="rtl">
                <div className="notAuth-message">
                    <p className="error-message">
                        {formMessage.message || "Unable to load profile data"}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-wrapper" dir="rtl">
            <form onSubmit={handleEditProfile}>
                {/* 1. Header Section (Top Card) */}
                <section className="profile-header-card">
                    <div className="user-main-info">
                        <div className="profile-avatar">
                            {/* {console.log("formatted image => ", encodeURI(profileForm.image.replace(/\\/g , "//").replace("uploads", "http://127.0.0.1:8080")))}  */}
                            {profileForm.image && <img src={encodeURI(profileForm.image.replace(/\\/g , "//").replace("uploads", "http://127.0.0.1:8080"))} alt="Profile"/>}
                            {/*error revealing the multer handled image*/}
                            {editMode && <input type="file" name="image" placeholder="upload image" onChange={handleChangeInput}></input>}
                        </div>

                        <div className="user-text">
                            {(profileForm.firstName || profileForm.lastName) && <h2>{(profileForm.firstName || '') + " " + (profileForm.lastName || '')}</h2>} {/*+ has more precedence than || so it needs association*/}
                            <div className="status-badges">
                                {profileForm.isEmailVerified?
                                 <span className="badge-green">الإيميل مفعل</span>:
                                 <span className="badge-red">الإيميل غير مفعل</span>}

                                 {profileForm.isPhoneVerified?
                                <span className="badge-green">رقم الهاتف مفعل</span>:
                                <span className="badge-red">رقم الهاتف غير مفعل</span>}
                            </div>

                            {profileForm.role === "admin" &&
                            <p className="last-seen">آخر تواجد: {profileForm.lastActivity}</p>
                            }
                        </div>
                    </div>
                    {profileForm.role === "client" &&
                    <div className="quick-stats">
                        <div className="stat">
                            <span>الطلبات</span>
                            <strong>{profileForm.totalOrders}</strong>
                        </div>
                        <div className="stat">
                            <span>إجمالي المشتريات</span>
                            <strong>{profileForm.totalSpent} EGP</strong>
                        </div>
                    </div>}
                </section>

                {formMessage.message && <p className={formMessage.success? "success-message": "error-message"}>{formMessage.message}</p>}

                <div className="profile-content-grid">    
                    {/* 2. Right Side: Personal Info*/}
                    <main className="main-form-content">
                        {/*common personal data */}
                        <section className="form-card">
                            <h3>المعلومات الشخصية</h3>
                            <div className="inputs-grid">
                                {((profileForm.firstName && !editMode) || editMode) &&
                                <div className="input-field">
                                <label>الاسم الاول</label>
                                <input name="firstName" value={profileForm.firstName} onChange={handleChangeInput} readOnly={!editMode}/>
                                </div>}

                                {((profileForm.lastName && !editMode) || editMode) &&
                                <div className="input-field">
                                <label>اسم العائلة</label>
                                <input name="lastName" value={profileForm.lastName} onChange={handleChangeInput} readOnly={!editMode}/>
                                </div>}

                                <div className="input-field">
                                <label>اسم المستخدم</label>
                                <input name="username" value={profileForm.username} onChange={handleChangeInput}  readOnly={!editMode}/>
                                </div>

                                <div className="input-field">
                                <label>البريد الإلكتروني</label>
                                <input name="email" value={profileForm.email} onChange={handleChangeInput} readOnly={!editMode} />
                                </div>

                                {((profileForm.phone && !editMode) || editMode) &&
                                <div className="input-field">
                                <label>رقم الهاتف</label>
                                <input name="phone" value={profileForm.phone} onChange={handleChangeInput} readOnly={!editMode}/>
                                </div>}
                            </div>

                            {((profileForm.gender && !editMode) || editMode) &&
                            <div className="gender-toggle">
                                <p>الجنس</p>
                                <button 
                                type="button" 
                                className={profileForm.gender === 'female' ? 'active' : ''}  
                                disabled={!editMode} 
                                onClick={() => handleSelection('gender', 'female')}
                                style= {{opacity: !editMode && profileForm.gender !== "female" ? 0.5 : 1}}
                                >أنثى
                                </button>
                                <button 
                                type="button" 
                                className={profileForm.gender === 'male' ? 'active' : ''} 
                                style= {{opacity: !editMode && profileForm.gender !== "male" ? 0.5 : 1}}
                                disabled={!editMode} 
                                onClick={() => handleSelection('gender', 'male')}
                                >ذكر
                                </button>
                            </div>}

                            {((profileForm.address && !editMode) || editMode) &&
                            <div className="address-fields">
                                <h3>العنوان</h3>
                                <div className="address-inputs">
                                    {(editMode || (profileForm.address?.city && !editMode)) &&
                                    <div className="input-field">
                                    <label>المدينة</label>
                                    <input name="address.city" value={profileForm.address?.city || ''} onChange={handleChangeInput} readOnly={!editMode}/>
                                    </div>}

                                    {((profileForm.address?.district && !editMode) || editMode) &&
                                    <div className="input-field">
                                    <label>المنطقة</label>
                                    <input name="address.district" value={profileForm.address?.district || ""} onChange={handleChangeInput} readOnly={!editMode}/>
                                    </div>}

                                    {((profileForm.address?.street && !editMode) || editMode) &&
                                    <div className="input-field">
                                    <label>الشارع</label>
                                    <input name="address.street" value={profileForm.address?.street || ""} onChange={handleChangeInput} readOnly={!editMode}/>
                                    </div>}
                                </div>
                            </div>}
                        </section>

                        {profileForm.role==="client" &&
                        <React.Fragment>
                            {/*additional client data */}
                            <section className="form-card skincare-section">
                                <h3>ملف العناية بالبشرة</h3>
                                <div className="skin-types">
                                    <p>نوع البشرة</p>
                                    {['جافة', 'دهنية', 'مختلطة', 'حساسة', 'عادية'].map(type =>(
                                    <button 
                                        key={type} 
                                        type="button"
                                        className={profileForm.skinType === type ? 'chip active' : 'chip'}
                                        onClick={() => handleSelection('skinType', type)}
                                        style= {{opacity: !editMode && profileForm.skinType !== type ? 0.5 : 1}}
                                        disabled={!editMode}
                                    >
                                        {type}
                                    </button>)
                                    )}
                                </div>
                                <div className="skin-interests">
                                    <p>الاهتمامات</p>
                                    {['حب الشباب', 'تجاعيد', 'جفاف', 'تصبغات', 'هالات سوداء'].map(item => (
                                    <button 
                                    key={item} 
                                    type="button" 
                                    onClick={() => handleSelection('skinConcerns', item)}
                                    className={profileForm.skinConcerns.includes(item) ? "chip active" : "chip"} 
                                    style= {{opacity: !editMode && !profileForm.skinConcerns.includes(item) ? 0.5 : 1}}
                                    disabled={!editMode}
                                    >
                                        {item}
                                    </button>)
                                    )}
                                </div>
                            </section>
                        </React.Fragment>}

                        {profileForm.role==="store_owner" &&
                        <React.Fragment>
                            {/*additional store_owner data */}
                            {/* Store Info */}
                            <section className="form-card">
                                <h3>بيانات المتجر</h3>

                                <div className="input-field">
                                    <label>اسم المتجر</label>
                                    <input name="store_name" value={profileForm.store_name} onChange={handleChangeInput} readOnly={!editMode} />
                                </div>

                                <div className="input-field">
                                    <label>بريد المتجر</label>
                                    <input name="store_email" value={profileForm.store_email} onChange={handleChangeInput} readOnly={!editMode}/>
                                </div>

                                <div className="input-field">
                                    <label>رقم هاتف المتجر</label>
                                    <input name="store_phone" value={profileForm.store_phone} onChange={handleChangeInput} readOnly={!editMode}/>
                                </div>
                                <br/>
                                <div className="store_address">
                                    <p>عنوان المتجر</p>
                                    <div className="address-inputs">
                                        <div className="input-field">
                                        <label>المدينة</label>
                                        <input name="store_address.city" value={profileForm.store_address.city} onChange={handleChangeInput} readOnly={!editMode}/>
                                        </div>

                                        <div className="input-field">
                                        <label>المنطقة</label>
                                        <input name="store_address.district" value={profileForm.store_address.district} onChange={handleChangeInput} readOnly={!editMode}/>
                                        </div>

                                        <div className="input-field">
                                        <label>الشارع</label>
                                        <input name="store_address.street" value={profileForm.store_address.street} onChange={handleChangeInput} readOnly={!editMode}/>
                                        </div>
                                    </div>
                                </div>

                                {((profileForm.store_description && !editMode) || editMode) &&
                                <textarea
                                    name="storeDescription"
                                    value={profileForm.store_description}
                                    onChange={handleChangeInput}
                                    readOnly={!editMode}
                                />}
                            </section>
                            <hr />

                            {/* Bank Info */}
                            {((profileForm.bankAccount && !editMode) || editMode) &&
                            <section className="form-card">
                                <h3>بيانات الدفع</h3>

                                {((profileForm.bankAccount?.bankName && !editMode) || editMode) &&
                                <div className="input-field">
                                    <label>اسم البنك</label>
                                    <input name="bankName" value={profileForm.bankAccount?.bankName} onChange={handleChangeInput} readOnly={!editMode}/>
                                </div>}

                                {((profileForm.bankAccount?.accountNumber && !editMode) || editMode) &&
                                <div className="input-field">
                                    <label>IBAN رقم الحساب</label>
                                    <input name="iban" value={profileForm.bankAccount?.accountNumber} onChange={handleChangeInput} readOnly={!editMode} />
                                </div>}

                                {((profileForm.bankAccount?.accountName && !editMode) || editMode) &&
                                <div className="input-field">
                                    <label>اسم الحساب</label>
                                    <input name="accountName" value={profileForm.bankAccount?.accountName} onChange={handleChangeInput} readOnly={!editMode}/>
                                </div>}
                            </section>}
                        </React.Fragment>}

                        {profileForm.role==="admin" &&
                        <React.Fragment>
                            {/*additional admin data */}
                            <section className="info-card">
                                <h3>الصلاحيات الممنوحة</h3>
                                <div className="permissions-grid">
                                    {profileForm.permissions.map(perm => (
                                    <div key={perm} className="permission-item">
                                        <span>{perm}</span>
                                        <input type="checkbox" checked readOnly />
                                    </div>
                                    ))}
                                </div>
                            </section>
                        </React.Fragment>}
                    </main>

                    {/* 3. Left Side: Password & Notifications */}
                    <aside className="sidebar-form-content">
                        <section className="form-card">
                        <h3>تفضيلات التنبيهات</h3>
                        <label className="checkbox-item">
                            <input type="checkbox" name="email" checked={profileForm.notifications?.includes("email")} onChange={handleChangeInput} disabled={!editMode}/>
                            البريد الإلكتروني
                        </label>
                        <label className="checkbox-item">
                            <input type="checkbox" name="push" checked={profileForm.notifications?.includes("push")} onChange={handleChangeInput}  disabled={!editMode}/>
                            تنبيهات التطبيق
                        </label>
                        <label className="checkbox-item">
                            <input type="checkbox" name="sms" checked={profileForm.notifications?.includes("sms")} onChange={handleChangeInput}  disabled={!editMode}/>
                            الرسائل النصية SMS
                        </label>
                        </section>

                        <div className="controllers">
                            {/* {formMessage.message && <p className="status-msg">{formMessage.message}</p>} */}
                            {editMode && <><button type="submit" className="btn-primary">حفظ التغييرات</button>
                            <button type="button" className="btn-secondary" onClick={()=>{loadUserData(); setEditMode(false);}}>إلغاء</button></>}

                            {!editMode && <><button className="btn-primary" onClick= {()=> {setEditMode(true);  setShowPasswordForm(false);}}>تعديل البيانات</button>
                            <button type="button" className="btn-danger" onClick={handleDeleteProfile}>حذف الحساب</button></>}
                        </div>
                    </aside>
                </div>
            </form>

            <form className="password-form form-card" onClick={()=>setShowPasswordForm(true)}>
                <h3>تغيير كلمة المرور</h3>
                { showPasswordForm && <React.Fragment>
                <input type="password" name="currentPassword" value={passwordForm.currentPassword} placeholder="كلمة المرور الحالية" onChange={handleChangeInput} />
                <input type="password" name="newPassword" value={passwordForm.newPassword} placeholder="كلمة المرور الجديدة" onChange={handleChangeInput} />
                <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} placeholder="تأكيد كلمة المرور" onChange={handleChangeInput} />
                <button type="submit" onClick= {handleChangePassword}>تغيير</button>
                </React.Fragment>}
            </form>
        </div>
    );
}

export default Profile;