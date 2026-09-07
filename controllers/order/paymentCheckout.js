const axios = require("axios");
const { sendEmail } = require("../../utils/mailSender");
const path = require("path");
const orderModel = require("../../models/order");
const { clientModel } = require("../../models/users/client");
const { billingSchema } = require("../../validations/billing");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const paymob_api_key = process.env.PAYMOB_API_KEY;
const paymob_card_integration_id = process.env.PAYMOB_CARD_INTEGRATION_ID;
const paymob_wallet_integration_id = process.env.PAYMOB_WALLET_INTEGRATION_ID;
const paymob_iframe_id = process.env.PAYMOB_IFRAME_ID;

const paymentCheckoutController = async (req, res) => {
  try {
    let {billing_data, payment_method} = req.body;
    const userId = req.user.id;
    const orderId = req.params.id;

    const parsedBillingData = billingSchema.safeParse(billing_data);

    if(!parsedBillingData.success)
      return res.status(400).json({message: `${parsedBillingData.error.issues[0].message}`});

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if(order.payment.status === "مكتمل")
      return res.status(400).json({message: "Payment already completed"});
    if(order.payment.status === "قيد المعالجة" && order.payment.method === payment_method)
      return res.status(400).json({message: `Payment redirect url already sent to your email for ${payment_method} payment`});

    const order_prods = [];
    let total_amount_cents = 0;

    for(let store_prods of order.products){
      for(let prod of store_prods.products){
        const amount_cents = (prod.price * prod.quantity) * 100;
        total_amount_cents += amount_cents;
        order_prods.push({
          "name": prod.name,
          "quantity": prod.quantity,
          "description": "",
          amount_cents
        });
      }
    }

    total_amount_cents += order.delivery_cost * 100;
    
    const authToken = await getAuthToken();
    const used_integration_id = payment_method === "card" ? paymob_card_integration_id : paymob_wallet_integration_id;
    const order_id = await registerOrder(authToken, total_amount_cents, order_prods);
    const paymentToken = await getPaymentKey(
      authToken,
      order_id,
      total_amount_cents,
      billing_data,
      used_integration_id,
    );

    let updatedUser = await clientModel.findByIdAndUpdate(userId, {$set:{
      firstName: billing_data.first_name,
      lastName: billing_data.last_name,
      email: billing_data.email,
      phoneNumber: billing_data.phone_number,
      address: {
        city: billing_data.city,
        street: billing_data.street,
      },
      additionalBillingData: {
        country: billing_data.country,
        building: billing_data.building,
        floor: billing_data.floor,
        apartment: billing_data.apartment,
      },
    }}, {new: true});

    if(parsedBillingData.email !== updatedUser.email){
      updatedUser.isEmailVerified = false;
    }

    if(parsedBillingData.phoneNumber !== updatedUser.phoneNumber){
      updatedUser.isPhoneVerified = false;
    }

    await updatedUser.save();

    order.payment.method = payment_method;
    if(payment_method !== "cash"){
      order.payment.status = "قيد المعالجة";
      order.payment.paymob_order_id = order_id;
    }
    await order.save();

    const to = updatedUser.email;
    if(payment_method === "cash"){
      return res.status(200).json({message: "billing data saved successfully"});
    }
    else if(payment_method === "card"){
      const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${paymob_iframe_id}?payment_token=${paymentToken}`;
      const emailHtml = getCardPaymentEmail(paymentUrl, order, updatedUser, total_amount_cents / 100);
      sendEmail({
        from: process.env.EMAIL,
        to: to,
        subject: "💳 إتمام الدفع - Glam2ena",
        html: emailHtml,
      });
      
      return res.status(200).json({
        message: "payment url sent to your email", 
        redirect_url: paymentUrl, 
        payment_token: paymentToken,
        savedBilling: updatedUser
      });
    }
    
    else if(payment_method === "wallet") {
      try {
          const walletPaymentResult = await processWalletPayment(paymentToken, billing_data.phone_number);
          
          order.payment.method = "wallet";
          order.payment.status = "قيد المعالجة";
          order.payment.paymob_order_id = order_id;
          order.payment.paymob_transaction_id = walletPaymentResult.transaction_id;
          await order.save();
          
          const to = updatedUser.email;
          const emailHtml = getWalletPaymentEmail(walletPaymentResult.redirect_url, order, updatedUser, total_amount_cents / 100);
          sendEmail({
            from: process.env.EMAIL,
            to: to,
            subject: "📱 إتمام الدفع بالمحفظة - Glam2ena",
            html: emailHtml,
          });
          
          return res.status(200).json({
              success: true,
              redirect_url: walletPaymentResult.redirect_url,
              transaction_id: walletPaymentResult.transaction_id,
              message: "Redirecting to wallet payment page",
              savedBilling: updatedUser
          });
          
      } catch(error) {
          console.error("Wallet payment error:", error);

          order.payment.status = "فشل";
          await order.save();
          if(error.iframe_redirect_url) {
              sendEmail({
                from: process.env.EMAIL,
                to: to,
                subject: "❌ فشل الدفع - Glam2ena",
                html: getPaymentFailedEmail(error.message),
              });
          }
          
          return res.status(400).json({
              success: false,
              message: error.message,
              iframe_redirect_url: error.iframe_redirect_url
          });
      }
   }

  } catch (err) {
    console.error({message: `error checkout the payment`, error: err});
    return res.status(500).json({ 
      message: "internal server error", 
      error: err.message 
    });
  }
};

// ─── Email Templates ────────────────────────────────────────

function getCardPaymentEmail(paymentUrl, order, user, totalAmount) {
  const orderId = order._id.toString().slice(-6).toUpperCase();
  const formattedTotal = totalAmount.toLocaleString('ar-EG');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إتمام الدفع - Glam2ena</title>
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
      border: 1px solid rgba(168, 85, 247, 0.22);
      box-shadow: 0 20px 60px rgba(75, 0, 130, 0.50);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #A855F7;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #A855F7;
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
      border: 1px solid rgba(168, 85, 247, 0.09);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .order-summary .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(168, 85, 247, 0.06);
    }
    .order-summary .row:last-child {
      border-bottom: none;
      font-size: 18px;
      font-weight: bold;
      padding-top: 10px;
      margin-top: 4px;
      border-top: 2px solid rgba(168, 85, 247, 0.15);
    }
    .order-summary .label {
      color: #c8aadf;
    }
    .order-summary .value {
      color: #f2e8ff;
      font-weight: 600;
    }
    .order-summary .total-value {
      color: #A855F7;
      font-size: 20px;
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
      background-color: rgba(168, 85, 247, 0.06);
      border-right: 4px solid #A855F7;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 8px;
      font-size: 13px;
      color: #c8aadf;
    }
    .info-box strong {
      color: #f2e8ff;
    }
    .payment-method-badge {
      display: inline-block;
      background: linear-gradient(135deg, #FF69B4, #A855F7);
      color: white;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
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
      <h1>💳 إتمام الدفع</h1>
      <p class="subtitle">طلبك رقم #${orderId} - ${user.firstName} ${user.lastName || ''}</p>
    </div>
    
    <div class="content">
      <p>مرحباً <strong>${user.firstName}</strong>،</p>
      
      <p>نحن على بعد خطوة واحدة من إتمام طلبك! استخدم الزر أدناه لإتمام عملية الدفع ببطاقتك الائتمانية.</p>
      
      <div class="order-summary">
        <div class="row">
          <span class="label">📦 رقم الطلب</span>
          <span class="value">#${orderId}</span>
        </div>
        <div class="row">
          <span class="label">💳 طريقة الدفع</span>
          <span class="value"><span class="payment-method-badge">بطاقة ائتمان</span></span>
        </div>
        <div class="row">
          <span class="label">المبلغ الإجمالي</span>
          <span class="value total-value">${formattedTotal} ج.م</span>
        </div>
      </div>
      
      <div class="button-container">
        <a href="${paymentUrl}" class="button">💳 إتمام الدفع الآن</a>
      </div>
      
      <div class="info-box">
        <strong>🔒 دفع آمن</strong><br>
        سيتم توجيهك إلى صفحة دفع آمنة ومشفرة. يتم الدفع عبر Paymob، وجميع بياناتك محمية بأعلى معايير الأمان.
      </div>
      
      <p style="font-size: 13px; color: #7a5a9a; text-align: center;">
        أو انسخ الرابط التالي وألصقه في متصفحك:<br>
        <a href="${paymentUrl}" style="color: #A855F7; word-break: break-all; font-size: 12px;">${paymentUrl}</a>
      </p>
    </div>
    
    <div class="footer">
      <p>هذا بريد إلكتروني آلي، يرجى عدم الرد عليه.</p>
      <p>© ${new Date().getFullYear()} Glam2ena. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>`;
}

function getWalletPaymentEmail(paymentUrl, order, user, totalAmount) {
  const orderId = order._id.toString().slice(-6).toUpperCase();
  const formattedTotal = totalAmount.toLocaleString('ar-EG');
  const walletProvider = order.payment?.method || 'المحفظة الإلكترونية';
  const phoneNumber = user.phoneNumber || billing_data?.phone_number || '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إتمام الدفع بالمحفظة - Glam2ena</title>
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
      border: 1px solid rgba(168, 85, 247, 0.22);
      box-shadow: 0 20px 60px rgba(75, 0, 130, 0.50);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #A855F7;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #A855F7;
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
      border: 1px solid rgba(168, 85, 247, 0.09);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .order-summary .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(168, 85, 247, 0.06);
    }
    .order-summary .row:last-child {
      border-bottom: none;
      font-size: 18px;
      font-weight: bold;
      padding-top: 10px;
      margin-top: 4px;
      border-top: 2px solid rgba(168, 85, 247, 0.15);
    }
    .order-summary .label {
      color: #c8aadf;
    }
    .order-summary .value {
      color: #f2e8ff;
      font-weight: 600;
    }
    .order-summary .total-value {
      color: #A855F7;
      font-size: 20px;
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
    .info-box {
      background-color: rgba(168, 85, 247, 0.06);
      border-right: 4px solid #A855F7;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 8px;
      font-size: 13px;
      color: #c8aadf;
    }
    .info-box strong {
      color: #f2e8ff;
    }
    .payment-method-badge {
      display: inline-block;
      background: linear-gradient(135deg, #FF69B4, #A855F7);
      color: white;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    .wallet-detail {
      background-color: rgba(168, 85, 247, 0.04);
      border-radius: 8px;
      padding: 8px 14px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #c8aadf;
      display: inline-block;
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
      <h1>📱 إتمام الدفع بالمحفظة</h1>
      <p class="subtitle">طلبك رقم #${orderId} - ${user.firstName} ${user.lastName || ''}</p>
    </div>
    
    <div class="content">
      <p>مرحباً <strong>${user.firstName}</strong>،</p>
      
      <p>نحن على بعد خطوة واحدة من إتمام طلبك! استخدم الزر أدناه لإتمام عملية الدفع عبر محفظتك الإلكترونية.</p>
      
      <div class="order-summary">
        <div class="row">
          <span class="label">📦 رقم الطلب</span>
          <span class="value">#${orderId}</span>
        </div>
        <div class="row">
          <span class="label">📱 طريقة الدفع</span>
          <span class="value"><span class="payment-method-badge">محفظة إلكترونية</span></span>
        </div>
        ${phoneNumber ? `<div class="row">
          <span class="label">📞 رقم المحفظة</span>
          <span class="value">${phoneNumber}</span>
        </div>` : ''}
        <div class="row">
          <span class="label">المبلغ الإجمالي</span>
          <span class="value total-value">${formattedTotal} ج.م</span>
        </div>
      </div>
      
      <div class="button-container">
        <a href="${paymentUrl}" class="button">📱 إتمام الدفع الآن</a>
      </div>
      
      <div class="info-box">
        <strong>🔒 دفع آمن عبر المحفظة</strong><br>
        سيتم توجيهك إلى صفحة الدفع بالمحفظة. ستصلك رسالة تأكيد على هاتفك لإتمام العملية.
      </div>
      
      <p style="font-size: 13px; color: #7a5a9a; text-align: center;">
        أو انسخ الرابط التالي وألصقه في متصفحك:<br>
        <a href="${paymentUrl}" style="color: #A855F7; word-break: break-all; font-size: 12px;">${paymentUrl}</a>
      </p>
    </div>
    
    <div class="footer">
      <p>هذا بريد إلكتروني آلي، يرجى عدم الرد عليه.</p>
      <p>© ${new Date().getFullYear()} Glam2ena. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>`;
}

function getPaymentFailedEmail(errorMessage) {
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
    .header h1 {
      color: #ef4444;
      margin: 0;
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
      <h1>❌ فشل الدفع</h1>
    </div>
    
    <div class="content">
      <p>عذراً، حدث خطأ أثناء محاولة إتمام الدفع.</p>
      
      <div class="info-box">
        <strong>⚠️ سبب الخطأ:</strong><br>
        ${errorMessage || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'}
      </div>
      
      <p>يمكنك محاولة إتمام الدفع مرة أخرى من خلال حسابك في Glam2ena.</p>
      
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://glam2ena.com/orders" class="button-secondary">📋 الذهاب إلى طلباتي</a>
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

// ─── Paymob API Functions ────────────────────────────────────

async function getAuthToken() {
  try {
    const response = await axios.post(
      "https://accept.paymob.com/api/auth/tokens",
      { api_key: paymob_api_key },
    );
    return response.data.token;
  } catch (err) {
    console.error(`error get paymob auth token-> ${err}`);
  }
}

async function registerOrder(authToken, amountCents, items) {
  try {
    const response = await axios.post(
      "https://accept.paymob.com/api/ecommerce/orders",
      {
        auth_token: authToken,
        currency: "EGP",
        amount_cents: amountCents.toString(),
        items: items || [],
        delivery_needed: false,
      },
    );
    return response.data.id;
  } catch (err) {
    console.error(`error register order to paymob-> ${err}`);
  }
}

async function getPaymentKey(
  authToken,
  order_id,
  amountCents,
  billingData,
  integration_id,
) {
  try {
    const response = await axios.post(
      "https://accept.paymob.com/api/acceptance/payment_keys",
      {
        auth_token: authToken,
        currency: "EGP",
        amount_cents: amountCents.toString(),
        order_id,
        integration_id: Number(integration_id),
        billing_data: billingData,
        expiration: 36000,
        lock_order_when_paid: false,
      },
    );
    return response.data.token;
  } catch (err) {
    console.error(`error getting payment key from paymob-> ${err}`);
  }
}

async function processWalletPayment(paymentToken, phoneNumber) {
  try {
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith("20")) {
      formattedPhone = "20" + phoneNumber.replace(/^0/, "");
    }
    
    const response = await axios.post(
      "https://accept.paymob.com/api/acceptance/payments/pay",
      {
        source: {
          identifier: formattedPhone,
          subtype: "WALLET"
        },
        payment_token: paymentToken
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://localhost:3000'
        }
      }
    );
    
    const redirectUrl = response.data.redirect_url;
    
    if (!redirectUrl) {
      throw new Error("No redirect_url received from Paymob for wallet payment");
    }
    
    return {
      success: true,
      redirect_url: redirectUrl,
      transaction_id: response.data.id
    };
    
  } catch (err) {
    console.error("Paymob Wallet Error:", err.response?.data || err.message);
    throw new Error("Failed to initiate wallet payment. Please check the phone number.");
  }
}

module.exports = paymentCheckoutController;