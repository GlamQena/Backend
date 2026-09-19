const jwt = require("jsonwebtoken");

// ---- Config resolution: map platform + rememberMe -> {expiry, maxAgeMs} ----
function resolveRefreshConfig(platform, rememberMe) {
  const isMobile = platform === "mobile";

  if (isMobile) {
    return rememberMe
      ? {
          expiry:  process.env.REFRESH_TOKEN_MOBILE_REMEMBERED_EXPIRY,
          maxAgeMs: parseInt(process.env.REFRESH_TOKEN_MOBILE_REMEMBERED_MS, 10),
        }
      : {
          expiry:  process.env.REFRESH_TOKEN_MOBILE_NORMAL_EXPIRY,
          maxAgeMs: parseInt(process.env.REFRESH_TOKEN_MOBILE_NORMAL_MS, 10),
        };
  }

  // default to web
  return rememberMe
    ? {
        expiry:  process.env.REFRESH_TOKEN_REMEMBERED_EXPIRY,
        maxAgeMs: parseInt(process.env.REFRESH_TOKEN_REMEMBERED_MS, 10),
      }
    : {
        expiry:  process.env.REFRESH_TOKEN_NORMAL_EXPIRY,
        maxAgeMs: parseInt(process.env.REFRESH_TOKEN_NORMAL_MS, 10),
      };
}

const setAccessToken = (res, user) => {
  try {
    const accessToken = jwt.sign(
      { user_id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: parseInt(process.env.ACCESS_TOKEN_MS, 10),
      sameSite: "lax",
      path: "/",
    });

    console.log("access token created successfully => " + accessToken);
    return accessToken;
  } catch (error) {
    console.log("error setting the access token -> " + error.message);
    return null;
  }
};

const setAccessRefreshTokens = (res, user, rememberMe = false, platform = "web") => {
  try {
    const accessToken = setAccessToken(res, user);
    if (!accessToken) return null;

    const { expiry: refreshTokenExpiry, maxAgeMs: refreshTokenMaxAge } =
      resolveRefreshConfig(platform, rememberMe);

    const refreshToken = jwt.sign(
      { user_id: user._id, role: user.role, platform },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: refreshTokenExpiry }
    );

    // Only set the cookie for web. Mobile clients store the token themselves.
    if (platform !== "mobile") {
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: refreshTokenMaxAge,
        sameSite: "lax",
        path: "/",
      });
    }

    console.log("refresh token created successfully => " + refreshToken);

    return {
      accessToken,
      refreshToken,
      // seconds — matches the JWT expiresIn semantics the client expects
      accessTokenExp:  Math.floor(parseInt(process.env.ACCESS_TOKEN_MS, 10) / 1000),
      refreshTokenExp: Math.floor(refreshTokenMaxAge / 1000),
      platform,
      rememberMe,
    };
  } catch (error) {
    console.log("error setting the refresh token -> " + error.message);
    return null;
  }
};

module.exports = { setAccessRefreshTokens, setAccessToken, resolveRefreshConfig };