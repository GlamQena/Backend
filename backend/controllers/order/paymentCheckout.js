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
    order.payment.status= "قيد المعالجة";
    order.payment.paymob_order_id= order_id;
    await order.save();

    const to= updatedUser.email;
    if(payment_method === "cash"){
      return res.status(200).json({message: "billing data saved successfully"});
    }
    else if(payment_method === "card"){
      await sendMail(to, `https://accept.paymob.com/api/acceptance/iframes/${paymob_iframe_id}?payment_token=${paymentToken}`);
      return res.status(200).json({message: "payment url sent to you're email", savedBilling: updatedUser});
    }
    else if(payment_method === "wallet"){

      try{
        const walletPaymentResult= await processWalletPayment(paymentToken, billing_data.phone_number);
        
        order.payment.status= "قيد المعالجة";
        order.payment.paymob_transaction_id= walletPaymentResult.transaction_id;
        await order.save();

        await sendMail(to, walletPaymentResult.redirect_url);
        return res.status(200).json({...walletPaymentResult, message: "Email sent to you with the payment redirect url",  savedBilling: updatedUser});
      }catch(error){
        
        if(error.iframe_redirect_url)
          await sendMail(to, error.iframe_redirect_url);
        return res.status(400).json({error: error.message, iframe_redirect_url: error.iframe_redirect_url});
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

const sendMail= async (to, text)=>{
  const mailOptions = {
    from: process.env.EMAIL,
    to: to,
    subject: "payment information",
    text,
  };
  await sendEmail(mailOptions);
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

async function processWalletPayment(paymentToken, phoneNumber) {
  try {
    console.log(`📱 Processing wallet payment for phone: ${phoneNumber}`);
    
    const response = await axios.post(
        "https://accept.paymob.com/api/acceptance/payments/pay",
        {
            source: {
                identifier: phoneNumber,  // The wallet number
                subtype: "WALLET"          // Specify it's a wallet payment
            },
            payment_token: paymentToken
        }
    );
    
    // console.log("wallet response data => ", response.data );

    if (response.data.error_occured) {
        
        const error = new Error(response.data.message || "Wallet payment failed");
        error.iframe_redirect_url = response.data.iframe_redirection_url;
        throw error; //new Error() constructor must take a string parameter not object, but it enable add additional properties after instantiating.
    }
    
    console.log("✅ Wallet payment response:", {
        redirect_url: response.data.redirect_url,
        transaction_id: response.data.id,
        iframe_redirect_url : response.data.iframe_redirection_url,
    });
    
    return {
        success: true,
        redirect_url: response.data.redirect_url, // This takes user to OTP page
        transaction_id: response.data.id
    }; //in case error occured redirect_url will be empty string, while the iframe_redirect_url will redirect to decline page.
    
  } catch (err) {
    console.error("Wallet payment error:", err);
    
    // Preserve any Paymob-specific properties
    const error = new Error(err.message || "Error processing wallet payment");
    if (err.iframe_redirect_url) {
        error.iframe_redirect_url = err.iframe_redirect_url;
    }
    throw error;
  }
}

module.exports = paymentCheckoutController;
