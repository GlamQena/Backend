import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [isLightMode, setIsLightMode] = useState(false);

    useEffect(() => {
        if (isLightMode) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }, [isLightMode]);

    const toggleTheme = () => {
        setIsLightMode(!isLightMode);
    };

    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const [activeSection, setActiveSection] = useState('home');

    useEffect(() => {
        const sections = document.querySelectorAll('section[id]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(section => observer.observe(section));
        return () => sections.forEach(section => observer.unobserve(section));
    }, []);

    return (
        <div className="container">
            {/* ========== Navbar ========== */}
            <nav className="navbar">
                <div className="logo">
                    <span className="logo-glam">Glam</span>
                    <span className="logo-qena">Qena</span>
                    <div className="logo-circle"></div>
                    <span className="logo-qena-ar">قنا</span>
                </div>
                <div className="nav-links">
                    <a href="#home" className={activeSection === 'home' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>الرئيسية</a>
                    <a href="#how-it-works" className={activeSection === 'how-it-works' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>كيف يعمل</a>
                    <a href="#for-whom" className={activeSection === 'for-whom' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('for-whom'); }}>لمن هذه المنصة</a>
                    <a href="#features" className={activeSection === 'features' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>المميزات</a>
                    <a href="#products" className={activeSection === 'products' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('products'); }}>المنتجات</a>
                </div>
                <div className="nav-actions">
                    <button className="btn-signup" onClick={() => window.location.href = '/signup'}>إنشاء حساب</button>
                    <button className="btn-login" onClick={() => window.location.href = '/login'}>تسجيل دخول</button>
                    <button className="theme-toggle" onClick={toggleTheme}>
                        <i className={isLightMode ? "fa-regular fa-sun-bright" : "fa-regular fa-moon"}></i>
                    </button>
                </div>
            </nav>

            {/* ========== Hero Section ========== */}
            <section id="home" className="hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span>أول منصة جمال متخصصة في قنا</span>
                        <div className="star"></div>
                    </div>
                    <h1>
                        <span className="white">الجمال يبدأ</span>
                        <span className="gradient">من قنا</span>
                    </h1>
                    <p className="hero-desc">
                        اكتشفي أرقى منتجات التجميل المختارة بعناية من أفضل المتاجر المحلية في قلب صعيد مصر.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn-shop" onClick={() => window.location.href = '/signup'}>ابدأ التسوق</button>
                        <button className="btn-discover" onClick={() => scrollToSection('features')}>اكتشف المنصة</button>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">24h</div>
                        <div className="stat-label">توصيل سريع</div>
                    </div>
                </div>
                <div className="hero-images">
                    <div className="glow"></div>
                    <div className="product-card card-1">
                        <div className="product-img-1"></div>
                        <div className="product-category">عناية فاخرة</div>
                        <div className="product-title">كريم ترطيب عميق</div>
                        <div className="product-rating">4.9 ★</div>
                    </div>
                    <div className="product-card card-2">
                        <div className="product-img-2"></div>
                        <div className="product-category">مكياج</div>
                        <div className="product-title">مجموعة أحمر شفاه</div>
                        <div className="product-price">١٢٠ ج.م</div>
                    </div>
                    <div className="product-card card-3">
                        <div className="product-img-3"></div>
                        <div className="product-category">زيوت طبيعية</div>
                        <div className="product-title">زيت الأركان النقي</div>
                        <div className="badge-best">الأكثر مبيعاً</div>
                    </div>
                    <div className="product-card card-4">
                        <div className="product-img-4"></div>
                        <div className="product-category">سيروم</div>
                        <div className="product-title">سيروم فيتامين C</div>
                        <div className="card-4-footer">
                            <span className="price-text">٣٥٠ ج.م</span>
                            <button className="cart-icon"><i className="fas fa-shopping-cart"></i></button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== Steps Section ========== */}
            <section id="how-it-works" className="steps-section">
                <div className="steps-container">
                    <div className="steps-small-title">خطوات بسيطة</div>
                    <h2 className="steps-section-title">من الطلب إلى <span className="accent">التسليم</span></h2>
                    <p className="steps-section-subtitle">أربع خطوات بسيطة تفصلك عن منتجات الجمال التي تحبينها</p>

                    <div className="steps-timeline">
                        <div className="step-item">
                            <div className="step-icon-wrapper">
                                <div className="step-icon-circle">
                                    <i className="fas fa-user-plus"></i>
                                </div>
                            </div>
                            <div className="step-line"></div>
                            <div className="step-content">
                                <h3 className="step-title">سجل حسابك</h3>
                                <p className="step-desc">إنشاء حساب مجاني في ثوانٍ وابدأ التسوق فوراً</p>
                            </div>
                        </div>

                        <div className="step-item">
                            <div className="step-icon-wrapper">
                                <div className="step-icon-circle">
                                    <i className="fas fa-shopping-cart"></i>
                                </div>
                            </div>
                            <div className="step-line"></div>
                            <div className="step-content">
                                <h3 className="step-title">اختر وأضف</h3>
                                <p className="step-desc">تصفح المنتجات وأضف ما يناسبك إلى السلة</p>
                            </div>
                        </div>

                        <div className="step-item">
                            <div className="step-icon-wrapper">
                                <div className="step-icon-circle">
                                    <i className="fas fa-check-circle"></i>
                                </div>
                            </div>
                            <div className="step-line"></div>
                            <div className="step-content">
                                <h3 className="step-title">أكد الطلب</h3>
                                <p className="step-desc">أدخل عنوانك وأكد طلبك في خطوة واحدة</p>
                            </div>
                        </div>

                        <div className="step-item">
                            <div className="step-icon-wrapper">
                                <div className="step-icon-circle">
                                    <i className="fas fa-truck"></i>
                                </div>
                            </div>
                            <div className="step-line"></div>
                            <div className="step-content">
                                <h3 className="step-title">استلم على بابك</h3>
                                <p className="step-desc">يوصل المندوب طلبك خلال 24 ساعة لبيتك</p>
                            </div>
                        </div>
                    </div>

                    <button className="btn-start" onClick={() => window.location.href = '/signup'}>ابدأ رحلة الجمال الآن</button>
                </div>
            </section>

            {/* ========== Delivery Section ========== */}
            <section className="delivery-section">
                <div className="delivery-container">
                    <div className="delivery-image">
                        <img src="/images/Container.png" alt="توصيل سريع" />
                    </div>
                    <div className="delivery-content">
                        <h3 className="delivery-title">توصيل سريع لعناية لا تنتظر</h3>
                        <p className="delivery-text">
                            في قنا، نؤمن أن الجمال لا يجب أن ينتظر. فريقنا يعمل على مدار الساعة لضمان
                            وصول مفضلاتك إليك في أسرع وقت وبأفضل حالة.
                        </p>
                        <div className="delivery-exclusive">EXCLUSIVE COLLECTIONS</div>
                    </div>
                </div>
            </section>

            {/* ========== For Whom Section ========== */}
            <section id="for-whom" className="for-whom">
                <div className="section-header">
                    <div className="section-badge">لمن هذه المنصة</div>
                    <h2>
                        <span className="purple">في مكان واحد</span>
                        <span className="white">كل ما تحتاجه</span>
                    </h2>
                    <p>نقدم حلولاً متكاملة لكل من يهتم بالجمال والتجميل</p>
                </div>
                <div className="cards-grid">
                    <div className="role-card">
                        <div className="icon-wrapper customer-icon">
                            <i className="fas fa-user"></i>
                        </div>
                        <h3>CUSTOMER</h3>
                        <div className="role-sub">(عميل)</div>
                        <div className="role-desc">تسوق منتجات التجميل من أفضل محلات قنا</div>
                        <div className="features-list customer-feature">
                            <div className="feature-item"><span>تتبع طلباتك في الوقت الفعلي</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>تصفح المحلات والمنتجات</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>توصيل سريع لباب البيت</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>أضف إلى السلة واطلب بسهولة</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>قيّمي المنتجات والمحلات</span> <i className="fas fa-check"></i></div>
                        </div>
                        <button className="btn-customer" onClick={() => window.location.href = '/signup'}>سجل كعميل</button>
                    </div>

                    <div className="role-card">
                        <div className="icon-wrapper store-icon">
                            <i className="fas fa-store"></i>
                        </div>
                        <h3>STORE OWNER</h3>
                        <div className="role-sub">(صاحب محل)</div>
                        <div className="role-desc">اعرض منتجاتك واستفد من قاعدة عملاء أوسع</div>
                        <div className="features-list store-feature">
                            <div className="feature-item"><span>أضف منتجاتك بسهولة</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>إدارة الطلبات والمخزون</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>لوحة تحكم متكاملة</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>تقارير المبيعات والأرباح</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>طلب سحب الأرباح</span> <i className="fas fa-check"></i></div>
                        </div>
                        <button className="btn-store" onClick={() => window.location.href = '/signup'}>سجل كصاحب محل</button>
                    </div>
                </div>
            </section>

            {/* ========== Features Section ========== */}
            <section id="features" className="section">
                <h2 className="section-title">تجربة تسوق <span className="accent">مميزة</span></h2>
                <p className="section-subtitle">نقدم لك كل ما تحتاجينه لجمالك في مكان واحد</p>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-store"></i></div>
                        <h3 className="feature-title">محلات موثوقة</h3>
                        <p className="feature-desc">نختار أفضل محلات التجميل في قنا لضمان جودة المنتجات وأصالتها.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-truck"></i></div>
                        <h3 className="feature-title">توصيل خلال 24 ساعة</h3>
                        <p className="feature-desc">شبكة توصيل سريعة تغطي جميع أحياء ومناطق قنا.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-lock"></i></div>
                        <h3 className="feature-title">دفع أمن ومضمون</h3>
                        <p className="feature-desc">خيارات دفع متعددة مع حماية كاملة لبياناتك الشخصية.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-check-circle"></i></div>
                        <h3 className="feature-title">ضمان الجودة</h3>
                        <p className="feature-desc">منتجات أصلية 100% مع ضمان الاسترجاع خلال 7 أيام.</p>
                    </div>
                </div>
            </section>

            {/* ========== Products Section ========== */}
            <section id="products" className="products-section">
                <div className="products-container">
                    <div className="products-header">
                        <h2 className="products-title">منتجات <span>مميزة</span></h2>
                        <p className="products-description">اكتشفي أفضل منتجات التجميل من محلات قنا</p>
                    </div>

                    <div className="products-grid">
                        {/* product 1 */}
                        <div className="product-card">
                            <div className="product-badge discount">خصم %20</div>
                            <div className="product-image product-image-1"></div>
                            <div className="add-btn">+</div>
                            <div className="product-content">
                                <div className="product-store-name">محل نور للتجميل</div>
                                <h3 className="product-name">سيروم فيتامين C</h3>
                                <p className="product-desc">تفتيح وتوحيد لون البشرة</p>
                                <div className="product-footer">
                                    <div>
                                        <span className="product-price-new">150 ج</span>
                                        <span className="product-price-old">185 ج</span>
                                    </div>
                                    <span className="product-rating">⭐ 4.5</span>
                                </div>
                            </div>
                        </div>

                        {/* product 2 */}
                        <div className="product-card">
                            <div className="product-badge discount">خصم %20</div>
                            <div className="product-image product-image-2"></div>
                            <div className="add-btn">+</div>
                            <div className="product-content">
                                <div className="product-store-name">محل نور للتجميل</div>
                                <h3 className="product-name">هايلايتر ذهبي</h3>
                                <p className="product-desc">لمسة إشراق طبيعية</p>
                                <div className="product-footer">
                                    <span className="product-price-new">95 ج</span>
                                    <span className="product-rating">⭐ 5.0</span>
                                </div>
                            </div>
                        </div>

                        {/* product 3 */}
                        <div className="product-card">
                            <div className="product-badge new">جديد</div>
                            <div className="product-image product-image-3"></div>
                            <div className="add-btn">+</div>
                            <div className="product-content">
                                <div className="product-store-name">محل نور للتجميل</div>
                                <h3 className="product-name">كريم SPF 30</h3>
                                <p className="product-desc">حماية وترطيب</p>
                                <div className="product-footer">
                                    <span className="product-price-new">120 ج</span>
                                    <span className="product-rating">⭐ 4.5</span>
                                </div>
                            </div>
                        </div>

                        {/* product 4 */}
                        <div className="product-card">
                            <div className="product-badge bestseller">الأكثر مبيعاً</div>
                            <div className="product-image product-image-4"></div>
                            <div className="add-btn">+</div>
                            <div className="product-content">
                                <div className="product-store-name">محل نور للتجميل</div>
                                <h3 className="product-name">روج مات</h3>
                                <p className="product-desc">ثبات 12 ساعة</p>
                                <div className="product-footer">
                                    <span className="product-price-new">85 ج</span>
                                    <span className="product-rating">⭐ 5.0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="view-all-btn">
                        <button className="btn-view-all">عرض جميع المنتجات</button>
                    </div>
                </div>
            </section>

            {/* ========== Footer Section ========== */}
            <div className="footer-section">
                <div className="footer-image">
                    <img src="/images/Overlay+ShadowDark.png" alt="Qena Glam" />
                    <div className="footer-image-content">
                        <h2>الجمال يبدأ من <span className="city">قنا</span></h2>
                        <p>اكتشفي أرقى منتجات التجميل المختارة بعناية من أفضل المتاجر<br />المحلية في قلب صعيد مصر.</p>
                    </div>
                </div>

                <footer className="footer">
                    <div className="footer-container">
                        <div className="footer-brand">
                            <div className="footer-logo">
                                <span className="footer-logo-glam">Glam</span>
                                <span className="footer-logo-qena">Qena</span>
                                <div className="footer-logo-circle"></div>
                                <span className="footer-logo-qena" style={{ fontFamily: "'Tajawal', sans-serif" }}>قنا</span>
                            </div>
                            <div className="footer-qena">قنا</div>
                            <p className="footer-desc">
                                أول منصة تجميل متخصصة في محافظة قنا. تقدم لك أفضل منتجات التجميل من محلات قنا مع توصيل سريع وأمن.
                            </p>
                        </div>

                        <div className="footer-contact">
                            <h4>تواصل معنا</h4>
                            <div className="footer-contact-item">
                                <i className="fas fa-phone"></i>
                                <span>010 1234 5678</span>
                            </div>
                            <div className="footer-contact-item">
                                <i className="fas fa-envelope"></i>
                                <span>info@glamqena.com</span>
                            </div>
                            <div className="footer-contact-item">
                                <i className="fas fa-map-marker-alt"></i>
                                <span>قنا - شارع النيل</span>
                            </div>
                            <div className="footer-contact-item footer-hours">
                                <i className="fas fa-clock"></i>
                                <span>السبت - الجمعة · 10:30 ص - 10:30 م</span>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2024 Qena Glam. جميع الحقوق محفوظة</p>
                    </div>
                </footer>
            </div>

            {/* Floating Chat Icon */}
            <div className="chat-float" onClick={() => alert('مرحباً! كيف يمكننا مساعدتك؟')}>
                <i className="fas fa-comment-dots"></i>
            </div>
        </div>
    );
}

export default App;