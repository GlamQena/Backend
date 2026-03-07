const axios= require("axios");
const sendMail = require("../../utils/mailSender");
const path= require("path");
require("dotenv").config({path: path.join(__dirname, "../.env")});

const paymob_api_key= process.env.PAYMOB_API_KEY;
const paymob_card_integration_id= process.env.PAYMOB_CARD_INTEGRATION_ID;
const paymob_wallet_integration_id= process.env.PAYMOB_WALLET_INTEGRATION_ID;
const paymob_iframe_id= process.env.PAYMOB_IFRAME_ID;

const paymentCheckout= async(req, res)=>{
    try{
        const authToken= await getAuthToken();
        const order_id= await registerOrder(authToken, 100000, [{name: "prod1", quantity:2, amount_cents: 50000, description:"dddf"},{name: "prod2", quantity:3, amount_cents: 50000, description: "hgvfcdxdd"}]);
        const paymentToken= await getPaymentKey(authToken, order_id, 100000, {
        first_name: "Semon",
        last_name: "hany",
        email: "semonhany848@gmail.com",
        phone_number: "01000000000", 
        name:"semon fathy", 
        city:"nag7ammadi", 
        street: "ali farok",
        building: "NA", 
        floor: "NA",    
        apartment: "NA",
        country: "EG"  }, paymob_card_integration_id);
        await sendMail(`https://accept.paymob.com/api/acceptance/iframes/${paymob_iframe_id}?payment_token=${paymentToken}`);
        res.status(200).json({message: "payment receipt url sent to you're email..."});
    }catch(err){
        console.error(`error chekout the payment-> ${err}`);
    }
}

async function getAuthToken(){
    try{
        const response= await axios.post("https://accept.paymob.com/api/auth/tokens", {api_key: paymob_api_key});
        return response.data.token;
    }catch(err){
        console.error(`error get paymob auth token-> ${err}`)
    }
}

async function registerOrder(authToken, amountCents, items){
    try{
        const response= await axios.post("https://accept.paymob.com/api/ecommerce/orders",{
            auth_token: authToken,
            currency: "EGP",
            amount_cents: amountCents.toString(),
            items: items || [],
            delivery_needed:false,
        });
        return response.data.id;
    }catch(err){
        console.error(`error register order to paymob-> ${err}`);
    }
}

async function getPaymentKey(authToken, order_id, amountCents, billingData, integration_id){
    try{
        const response= await axios.post("https://accept.paymob.com/api/acceptance/payment_keys",{
            auth_token: authToken,
            currency: "EGP",
            amount_cents: amountCents,
            order_id,
            integration_id: Number(integration_id),
            billing_data: billingData,
            expiration: 36000,
            lock_order_when_paid: false,
        });
        return response.data.token;
    }catch(err){
        console.error(`error getting payment key from paymob-> ${err}`);
    }
}

//ToDo-> handle the wallet processing step
module.exports= paymentCheckout;