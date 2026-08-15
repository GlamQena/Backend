const jwt = require("jsonwebtoken");
const { clientModel } = require("../../models/users/client");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");
const { setAccessToken } = require("../../utils/acc_ref_tokens");

const refreshAccessTokenController = async (req, res) => {
    try {
        let refreshToken;
        
        // Try to get refresh token from Authorization header
        const headerAuth = req.headers.authorization || req.headers.Authorization;
        if (headerAuth && headerAuth.startsWith("Bearer")) {
            refreshToken = headerAuth.split(" ")[1];
        } 
        // If not in header, try to get from cookies
        else if (req.cookies && req.cookies.refreshToken) {
            refreshToken = req.cookies.refreshToken;
        }

        if (!refreshToken || refreshToken === "null" || refreshToken === "undefined") {
            return res.status(401).json({ message: "Refresh token missing!" });
        }

        // Verify the refresh token synchronously
        let decodedRefreshToken;
        try {
            decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (error) {
            console.error("Refresh token verification failed:", error.message);
            return res.status(401).json({ 
                message: error.name === 'TokenExpiredError' 
                    ? "Refresh token expired, please login again" 
                    : "Invalid refresh token!" 
            });
        }

        // Extract user info from decoded token
        const { user_id, role } = decodedRefreshToken;
        
        if (!user_id || !role) {
            return res.status(401).json({ message: "Invalid token payload!" });
        }

        // Find the user based on role
        let loggedUser;
        try {
            switch (role) {
                case "client":
                    loggedUser = await clientModel.findById(user_id).lean();
                    break;
                case "store_owner":
                    loggedUser = await storeOwnerModel.findById(user_id).lean();
                    break;
                case "admin":
                    loggedUser = await adminModel.findById(user_id).lean();
                    break;
                default:
                    return res.status(401).json({ message: "Unsupported user role!" });
            }
        } catch (dbError) {
            console.error("Database error:", dbError.message);
            return res.status(500).json({ message: "Database error occurred" });
        }

        if (!loggedUser) {
            return res.status(401).json({ message: "User not found" });
        }

        // Generate new access token
        const accessToken = setAccessToken(res, loggedUser);
        
        if (!accessToken) {
            return res.status(500).json({ message: "Failed to generate access token" });
        }

        // Return success response with new access token
        res.status(200).json({
            message: "Access token refreshed successfully",
            user: {
                _id: loggedUser._id,
                username: loggedUser.username,
                email: loggedUser.email,
                role: loggedUser.role,
                firstName: loggedUser.firstName,
                lastName: loggedUser.lastName,
                image: loggedUser.image,
                // Include any other necessary user fields
            },
            accessToken: accessToken
        });

    } catch (error) {
        console.error("Refresh token controller error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = refreshAccessTokenController;