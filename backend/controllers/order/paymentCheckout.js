const axios = require("axios");
const { sendEmailMessage } = require("../../utils/mailSender");
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
    let {billing_data, payment_method}= req.body;
    const userId= req.user.id;
    const orderId= req.params.id;

    const parsedBillingData= billingSchema.safeParse(billing_data);

    if(!parsedBillingData.success)
      return res.status(400).json({message: `${parsedBillingData.error.issues[0].message}`});

    const order= await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if(order.payment.status === "مكتمل")
      return res.status(400).json({message: "Payment already completed"});
    if(order.payment.status === "قيد المعالجة" && order.payment.method === payment_method)
      return res.status(400).json({message: `Payment redirect url already sent to your email for ${payment_method} payment`});
      //TODO => store paymob_redirect_expires_at prop in order payment to check in case of status processing and send again if expired.

    const order_prods=[];
    let total_amount_cents=0;

    for(let store_prods of order.products){
      for(let prod of store_prods.products){
        const amount_cents = (prod.price * prod.quantity) * 100;
        total_amount_cents+=amount_cents;
        order_prods.push({
          "name": prod.name,
          "quantity": prod.quantity,
          "description": "",
          amount_cents
        });
      }
    }

    total_amount_cents+= order.delivery_cost * 100;
    
    const authToken = await getAuthToken();
    const used_integration_id= payment_method === "card" ? paymob_card_integration_id : paymob_wallet_integration_id;
    const order_id = await registerOrder(authToken, total_amount_cents, order_prods);
    const paymentToken = await getPaymentKey(
      authToken,
      order_id,
      total_amount_cents,
      billing_data,
      used_integration_id,
    );

    let updatedUser= await clientModel.findByIdAndUpdate(userId, {$set:{
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
      // billingDataSaved: true,
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
      order.payment.status= "قيد المعالجة";
      order.payment.paymob_order_id= order_id;
    }
    await order.save();

    const to= updatedUser.email;
    if(payment_method === "cash"){
      return res.status(200).json({message: "billing data saved successfully"});
    }
    else if(payment_method === "card"){
      sendMail(to, `https://accept.paymob.com/api/acceptance/iframes/${paymob_iframe_id}?payment_token=${paymentToken}`);
      return res.status(200).json({message: "payment url sent to you're email", redirect_url: `https://accept.paymob.com/api/acceptance/iframes/${paymob_iframe_id}?payment_token=${paymentToken}`, savedBilling: updatedUser});
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
          sendMail(to, walletPaymentResult.redirect_url);
          
          return res.status(200).json({
              success: true,
              redirect_url: walletPaymentResult.redirect_url,  // This is Paymob's wallet page
              transaction_id: walletPaymentResult.transaction_id,
              message: "Redirecting to wallet payment page",
              savedBilling: updatedUser
          });
          
      } catch(error) {
          console.error("Wallet payment error:", error);

          order.payment.status = "فشل";
          await order.save();
          // If there's an iframe redirect URL (for decline page), send it
          if(error.iframe_redirect_url) {
              sendMail(to, error.iframe_redirect_url);
          }
          
          return res.status(400).json({
              success: false,
              message: error.message,
              iframe_redirect_url: error.iframe_redirect_url
          });
      }
   }

  } catch (err) {
    console.error({message: `error chekout the payment`, error: err});
    return res.status(500).json({ 
      message: "internal server error", 
      error: err.message 
    });
  }
};

const sendMail= (to, text)=>{
  const mailOptions = {
    from: process.env.EMAIL,
    to: to,
    subject: "payment information",
    text,
  };
  sendEmailMessage(mailOptions);
}

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

// CORRECT: processWalletPayment implementation
async function processWalletPayment(paymentToken, phoneNumber) {
  try {
    // Format phone number with country code (e.g., 201234567890)
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith("20")) {
      formattedPhone = "20" + phoneNumber.replace(/^0/, "");
    }
    
    // 1. Call the specific 'pay' endpoint for wallet
    const response = await axios.post(
      "https://accept.paymob.com/api/acceptance/payments/pay", // This is the correct endpoint
      {
        source: {
          identifier: formattedPhone, // The wallet mobile number
          subtype: "WALLET"           // IMPORTANT: Specify it's a wallet
        },
        payment_token: paymentToken    // The token you already generated
      }
    );
    
    // 2. The API returns a redirect_url to the wallet authentication page
    //    This URL points to Paymob, NOT your frontend orders page
    const redirectUrl = response.data.redirect_url;
    
    if (!redirectUrl) {
      throw new Error("No redirect_url received from Paymob for wallet payment");
    }
    
    // 3. Return this URL. Your frontend MUST navigate to it.
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
