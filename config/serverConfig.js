const os = require('os');

const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
};

const LOCAL_IP = getLocalIP();

// Development origins
const devOrigins = [
  'https://frontend-lpnvakl5t-semonhany848-7024s-projects.vercel.app',
  'https://glamqena.vercel.app',
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  `http://${LOCAL_IP}:3000`,
  `http://${LOCAL_IP}:3001`,
  "http://192.168.1.100:3000", // Common local network IPs
  "http://192.168.1.101:3000",
  // Allow any local network IP (for mobile testing)
  (origin) => {
    // Dynamic check for local network origins
    if (!origin) return true;
    const isLocalNetwork = origin.match(/^http:\/\/192\.168\./) || 
                          origin.match(/^http:\/\/10\./) ||
                          origin.match(/^http:\/\/172\.16\./) ||
                          origin.match(/^http:\/\/localhost/) ||
                          origin.match(/^http:\/\/127\.0\.0\.1/);
    return !!isLocalNetwork;
  }
];

// Production origins
const prodOrigins = [
  "https://glamqena.vercel.app",
  "https://frontend-217hp0m4y-semonhany848-7024s-projects.vercel.app",
  "https://frontend-lpnvakl5t-semonhany848-7024s-projects.vercel.app",
  "https://frontend-2dtdskvlw-semonhany848-7024s-projects.vercel.app/"
];

// CORS configuration function
const getCorsOrigin = (origin, callback) => {
  // Allow requests with no origin (like mobile apps, Postman, etc.)
  if (!origin) {
    return callback(null, true);
  }

  // Production mode - strict
  if (process.env.NODE_ENV === 'production') {
    const allowed = prodOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      return false;
    });
    
    if (allowed) {
      return callback(null, true);
    }
    console.warn(`CORS blocked (production): ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  }

  // Development mode - flexible
  const isAllowed = devOrigins.some(allowedOrigin => {
    if (typeof allowedOrigin === 'function') {
      return allowedOrigin(origin);
    }
    if (typeof allowedOrigin === 'string') {
      return origin === allowedOrigin;
    }
    return false;
  });

  if (isAllowed) {
    return callback(null, true);
  }

  // Allow if it's a local network IP (192.168.x.x, 10.x.x.x, etc.)
  const isLocalNetwork = origin.match(/^http:\/\/192\.168\./) || 
                        origin.match(/^http:\/\/10\./) ||
                        origin.match(/^http:\/\/172\.16\./) ||
                        origin.match(/^http:\/\/localhost/) ||
                        origin.match(/^http:\/\/127\.0\.0\.1/);

  if (isLocalNetwork) {
    console.log(`CORS allowed (local network): ${origin}`);
    return callback(null, true);
  }

  console.warn(`CORS blocked (development): ${origin}`);
  callback(new Error(`Origin ${origin} not allowed by CORS`));
};

module.exports = {
  LOCAL_IP,
  devOrigins,
  prodOrigins,
  getCorsOrigin,
  // For backward compatibility
  allowedOrigins: devOrigins,
  CORS_ORIGIN: getCorsOrigin, // Pass the function directly
};