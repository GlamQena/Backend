const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.API_URL;
const MOBILE_DEEP_LINK = process.env.MOBILE_DEEP_LINK || "glamqena://";

if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not defined. Check your .env files.");
}
if (!BACKEND_URL) {
  throw new Error("BACKEND_URL is not defined. Check your .env files.");
}

function webUrl(pathname = "/") {
  return `${FRONTEND_URL.replace(/\/$/, "")}${pathname}`;
}

function backendUrl(pathname = "/") {
  return `${BACKEND_URL.replace(/\/$/, "")}${pathname}`;
}

function mobileUrl(host, query = {}) {
  const qs = new URLSearchParams(query).toString();
  return `${MOBILE_DEEP_LINK}${host}${qs ? `?${qs}` : ""}`;
}

module.exports = {
  FRONTEND_URL,
  BACKEND_URL,
  MOBILE_DEEP_LINK,
  webUrl,
  backendUrl,
  mobileUrl,

  ORDERS_WEB: webUrl("/orders"),
  ORDERS_MOBILE: mobileUrl("orders"),
  LOGIN_WEB: webUrl("/login"),
  VERIFY_EMAIL_WEB: webUrl("/verify-email"),
};