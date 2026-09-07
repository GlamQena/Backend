const orderModel = require("../../models/order");
const { clientModel } = require("../../models/users/client");
const { sendEmail } = require("../../utils/mailSender");

const checkPaymentCompletion = async (req, res) => {
    try {
        const { obj, type } = req.body;
        const { success, order } = obj;
        console.log("payment completion req body-> ", req.body);

        if (!obj || !obj.order) {
            console.error(`obj order from paymob not found`);
            return res.status(200).end("failed");
        }

        const foundOrder = await orderModel.findOne({ "payment.paymob_order_id": order.id });

        if (!foundOrder) {
            console.error(`order with paymob id ${order.id} not found`);
            return res.status(200).end("failed");
        }

        // Get client for email
        const client = await clientModel.findById(foundOrder.user_id);
        if (!client) {
            console.error(`Client not found for order ${foundOrder._id}`);
            return res.status(200).end("failed");
        }

        if (!success) {
            console.error("payment checkout failed!");

            foundOrder.status = "ملغي";
            foundOrder.payment.status = "فشل";
            await foundOrder.save();

            // Send failure email with template
            const failureEmailHtml = getPaymentFailureEmail(client, foundOrder);
            sendEmail({
                to: client.email,
                subject: "❌ فشل الدفع - Glam2ena",
                html: failureEmailHtml,
            });

            return res.status(200).end("failed");
        }

        console.log("payment completed successfully for order ", order.id);

        // Update client and order
        const updatedClient = await clientModel.findByIdAndUpdate(
            foundOrder.user_id,
            {
                $set: { isEmailVerified: true },
                $inc: { totalSpent: foundOrder.total_price }
            },
            { new: true }
        );

        foundOrder.payment.status = "مكتمل";
        if (type === "TRANSACTION") {
            foundOrder.payment.paymob_transaction_id = obj.id;
        }
        foundOrder.payment.completedAt = new Date();
        await foundOrder.save();

        // Send success email with template
        const successEmailHtml = getPaymentSuccessEmail(updatedClient, foundOrder);
        sendEmail({
            to: updatedClient.email,
            subject: "✅ تأكيد الدفع - Glam2ena",
            html: successEmailHtml,
        });

        res.status(200).end("OK");

    } catch (error) {
        console.error("Webhook error:", error);
        res.status(200).end("failed");
    }
};

// ─── Email Templates ────────────────────────────────────────

function getPaymentSuccessEmail(client, order) {
    const orderId = order._id.toString().slice(-6).toUpperCase();
    const totalAmount = order.total_price.toLocaleString('ar-EG');
    const orderDate = new Date(order.createdAt).toLocaleDateString('ar-EG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const orderTime = new Date(order.createdAt).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Get payment method label
    const paymentMethodMap = {
        card: 'بطاقة ائتمان',
        cash: 'الدفع عند الاستلام',
        wallet: 'محفظة إلكترونية'
    };
    const paymentMethod = paymentMethodMap[order.payment?.method] || order.payment?.method || 'بطاقة ائتمان';

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد الدفع - Glam2ena</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #f2e8ff;
      background-color: #07040f;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #1a0e2e;
      border-radius: 28px;
      padding: 30px;
      border: 1px solid rgba(34, 197, 94, 0.22);
      box-shadow: 0 20px 60px rgba(75, 0, 130, 0.50);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #22c55e;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header .success-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }
    .header h1 {
      color: #22c55e;
      margin: 0;
      font-size: 24px;
    }
    .header .subtitle {
      color: #c8aadf;
      font-size: 14px;
      margin-top: 4px;
    }
    .content {
      margin-bottom: 30px;
    }
    .content p {
      color: #c8aadf;
    }
    .content strong {
      color: #f2e8ff;
    }
    .order-summary {
      background-color: #0e0819;
      border: 1px solid rgba(34, 197, 94, 0.09);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .order-summary .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(34, 197, 94, 0.06);
    }
    .order-summary .row:last-child {
      border-bottom: none;
      font-size: 18px;
      font-weight: bold;
      padding-top: 10px;
      margin-top: 4px;
      border-top: 2px solid rgba(34, 197, 94, 0.15);
    }
    .order-summary .label {
      color: #c8aadf;
    }
    .order-summary .value {
      color: #f2e8ff;
      font-weight: 600;
    }
    .order-summary .total-value {
      color: #22c55e;
      font-size: 20px;
    }
    .payment-badge {
      display: inline-block;
      background: linear-gradient(135deg, #FF69B4, #A855F7);
      color: white;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    .status-badge {
      display: inline-block;
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }
    .button-container {
      text-align: center;
      margin: 24px 0 16px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #FF69B4, #A855F7);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(168, 85, 247, 0.50);
    }
    .button-secondary {
      display: inline-block;
      background: transparent;
      color: #A855F7;
      padding: 10px 24px;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
      border: 1.5px solid rgba(168, 85, 247, 0.22);
      transition: all 0.2s ease;
    }
    .button-secondary:hover {
      background: rgba(168, 85, 247, 0.08);
      border-color: rgba(168, 85, 247, 0.4);
    }
    .info-box {
      background-color: rgba(34, 197, 94, 0.04);
      border-right: 4px solid #22c55e;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 8px;
      font-size: 13px;
      color: #c8aadf;
    }
    .info-box strong {
      color: #f2e8ff;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #7a5a9a;
      border-top: 1px solid rgba(168, 85, 247, 0.09);
      padding-top: 20px;
      margin-top: 20px;
    }
    .footer a {
      color: #A855F7;
      text-decoration: none;
    }
    .delivery-estimate {
      background: rgba(168, 85, 247, 0.04);
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      color: #c8aadf;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1>تم الدفع بنجاح!</h1>
      <p class="subtitle">شكراً لك على ثقتك، طلبك قيد المعالجة</p>
    </div>
    
    <div class="content">
      <p>مرحباً <strong>${client.firstName || 'عميلنا العزيز'}</strong>،</p>
      
      <p>يسعدنا إعلامك بأن عملية الدفع قد تمت بنجاح. تم تأكيد طلبك وسيتم تجهيزه قريباً.</p>
      
      <div class="order-summary">
        <div class="row">
          <span class="label">📦 رقم الطلب</span>
          <span class="value">#${orderId}</span>
        </div>
        <div class="row">
          <span class="label">📅 تاريخ الطلب</span>
          <span class="value">${orderDate} - ${orderTime}</span>
        </div>
        <div class="row">
          <span class="label">💳 طريقة الدفع</span>
          <span class="value"><span class="payment-badge">${paymentMethod}</span></span>
        </div>
        <div class="row">
          <span class="label">📊 حالة الدفع</span>
          <span class="value"><span class="status-badge">✓ مكتمل</span></span>
        </div>
        ${order.payment?.paymob_transaction_id ? `<div class="row">
          <span class="label">🆔 رقم المعاملة</span>
          <span class="value" style="font-family: monospace; font-size: 13px;">${order.payment.paymob_transaction_id}</span>
        </div>` : ''}
        <div class="row">
          <span class="label">المبلغ المدفوع</span>
          <span class="value total-value">${totalAmount} ج.م</span>
        </div>
      </div>
      
      <div class="info-box">
        <strong>📋 ماذا يحدث الآن؟</strong><br>
        • سيتم تجهيز طلبك خلال 24-48 ساعة عمل<br>
        • ستصلك رسالة تأكيد عند شحن الطلب<br>
        • يمكنك تتبع طلبك في أي وقت من خلال حسابك
      </div>
      
      <div class="delivery-estimate">
        🚚 وقت التوصيل المتوقع: 3-5 أيام عمل
      </div>
      
      <div class="button-container">
        <a href="http://127.0.0.1:3000/orders/${order._id}" class="button">📋 تتبع طلبك</a>
        <br><br>
        <a href="http://127.0.0.1:3000" class="button-secondary">🏠 العودة إلى المتجر</a>
      </div>
    </div>
    
    <div class="footer">
      <p>هذا بريد إلكتروني آلي، يرجى عدم الرد عليه.</p>
      <p>© ${new Date().getFullYear()} Glam2ena. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>`;
}

function getPaymentFailureEmail(client, order) {
    const orderId = order._id.toString().slice(-6).toUpperCase();
    const totalAmount = order.total_price.toLocaleString('ar-EG');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فشل الدفع - Glam2ena</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #f2e8ff;
      background-color: #07040f;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #1a0e2e;
      border-radius: 28px;
      padding: 30px;
      border: 1px solid rgba(239, 68, 68, 0.22);
      box-shadow: 0 20px 60px rgba(75, 0, 130, 0.50);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #ef4444;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header .fail-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }
    .header h1 {
      color: #ef4444;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin-bottom: 30px;
    }
    .content p {
      color: #c8aadf;
    }
    .content strong {
      color: #f2e8ff;
    }
    .order-summary {
      background-color: #0e0819;
      border: 1px solid rgba(239, 68, 68, 0.09);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .order-summary .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(239, 68, 68, 0.06);
    }
    .order-summary .row:last-child {
      border-bottom: none;
    }
    .order-summary .label {
      color: #c8aadf;
    }
    .order-summary .value {
      color: #f2e8ff;
      font-weight: 600;
    }
    .info-box {
      background-color: rgba(239, 68, 68, 0.06);
      border-right: 4px solid #ef4444;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 8px;
      font-size: 13px;
      color: #c8aadf;
    }
    .info-box strong {
      color: #f2e8ff;
    }
    .button-container {
      text-align: center;
      margin: 24px 0 16px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #FF69B4, #A855F7);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(168, 85, 247, 0.50);
    }
    .button-secondary {
      display: inline-block;
      background: transparent;
      color: #A855F7;
      padding: 10px 24px;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
      border: 1.5px solid rgba(168, 85, 247, 0.22);
      transition: all 0.2s ease;
    }
    .button-secondary:hover {
      background: rgba(168, 85, 247, 0.08);
      border-color: rgba(168, 85, 247, 0.4);
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #7a5a9a;
      border-top: 1px solid rgba(168, 85, 247, 0.09);
      padding-top: 20px;
      margin-top: 20px;
    }
    .footer a {
      color: #A855F7;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="fail-icon">❌</div>
      <h1>فشل الدفع</h1>
    </div>
    
    <div class="content">
      <p>عذراً <strong>${client.firstName || 'عميلنا العزيز'}</strong>،</p>
      
      <p>نأسف لإبلاغك بأن عملية الدفع للطلب رقم <strong>#${orderId}</strong> لم تكتمل.</p>
      
      <div class="order-summary">
        <div class="row">
          <span class="label">📦 رقم الطلب</span>
          <span class="value">#${orderId}</span>
        </div>
        <div class="row">
          <span class="label">المبلغ</span>
          <span class="value">${totalAmount} ج.م</span>
        </div>
      </div>
      
      <div class="info-box">
        <strong>⚠️ أسباب محتملة:</strong><br>
        • بيانات الدفع غير صحيحة<br>
        • رصيد غير كافٍ<br>
        • انتهاء صلاحية البطاقة<br>
        • مشكلة في الاتصال بالبنك
      </div>
      
      <p>يمكنك محاولة إتمام الدفع مرة أخرى من خلال حسابك في Glam2ena.</p>
      
      <div class="button-container">
        <a href="http://127.0.0.1:3000/orders/${order._id}" class="button">🔄 محاولة الدفع مرة أخرى</a>
        <br><br>
        <a href="http://127.0.0.1:3000" class="button-secondary">🏠 العودة إلى المتجر</a>
      </div>
    </div>
    
    <div class="footer">
      <p>هذا بريد إلكتروني آلي، يرجى عدم الرد عليه.</p>
      <p>© ${new Date().getFullYear()} Glam2ena. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = checkPaymentCompletion;