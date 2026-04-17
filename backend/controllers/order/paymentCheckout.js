const axios = require("axios");
const { sendEmail } = require("../../utils/mailSender");
const path = require("path");
const orderModel = require("../../models/order");
const productModel = require("../../models/product");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const paymob_api_key = process.env.PAYMOB_API_KEY;
const paymob_card_integration_id = process.env.PAYMOB_CARD_INTEGRATION_ID;
const paymob_wallet_integration_id = process.env.PAYMOB_WALLET_INTEGRATION_ID;
const paymob_iframe_id = process.env.PAYMOB_IFRAME_ID;

const paymentCheckoutController = async (req, res) => {
  try {
    let {billing_data, payment_method}= req.body;
    const orderId= req.params.id;

    const authToken = await getAuthToken();

    const order= await orderModel.findById(orderId);
    const order_prods=[];
    let total_amount_cents=0;

    for(let store_prods of order.products){
      for(let prod of store_prods.products){
        const product= await productModel.findById(prod.prod_id).select("name quantity price description").lean();
        product.amount_cents = product.price * 100;
        total_amount_cents+=product.amount_cents;
        delete product["price"];
        order_prods.push(product);
      }
    }

    const used_integration_id= payment_method === "card" ? paymob_card_integration_id : paymob_wallet_integration_id;
    const order_id = await registerOrder(authToken, total_amount_cents, order_prods);
    const paymentToken = await getPaymentKey(
      authToken,
      order_id,
      total_amount_cents,
      billing_data,
      used_integration_id,
    );

    order.payment.method = payment_method;
    order.payment.paymob_order_id= order_id;
    order.payment.status= "processing";
    await order.save();

    if(payment_method === "card"){
      await sendMail(`https://accept.paymob.com/api/acceptance/iframes/${paymob_iframe_id}?payment_token=${paymentToken}`);
      return res.status(200).json({ message: "payment url sent to you're email..." });
    }
    else if(payment_method === "wallet"){

      try{
        const walletPaymentResult= await processWalletPayment(paymentToken, billing_data.phone_number);
        
        order.payment.status= "processing";
        order.payment.paymob_transaction_id= walletPaymentResult.transaction_id;
        await order.save();

        await sendMail(walletPaymentResult.redirect_url);
        return res.status(200).json(walletPaymentResult);
      }catch(error){
        
        if(error.iframe_redirect_url)
          await sendMail(error.iframe_redirect_url);
        return res.status(400).json({error: error.message, iframe_redirect_url: error.iframe_redirect_url});
      }
    }
  } catch (err) {
    console.error({message: `error chekout the payment`, error: err});
  }
};

const sendMail= async (text)=>{
  const mailOptions = {
    from: process.env.EMAIL,
    to: "semooohany@gmail.com",
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
        amount_cents: amountCents,
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
        throw new Error({message: `Error processing wallet payment`, error: err});
    }
}

module.exports = paymentCheckoutController;
