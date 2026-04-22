import { CheckCircle } from "lucide-react"; // استدعيت أيقونة واحدة كمثال
import "./Success.css";

function Verified() { 
  return (
    <div className="verified-container">
      <CheckCircle size={48} color="green" />
      
        {/*<img src="images/verification.gif" alt="err"/>*/}
      <h1>!تم التحقق بنجاح</h1>
      <p>تم تفعيل بريدك الالكتروني يمكنك الان الدخول والاستمتاع بتجربة التسوق</p>
    </div>
  );
}

export default Verified;
