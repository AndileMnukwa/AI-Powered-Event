const { verify } = require("jsonwebtoken");

// Helper function for sending error responses
const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({ error: message });
};

const validateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
        console.log("Authorization header missing");
        return sendError(res, 401, "Authorization header missing");
    }

    const token = authHeader.split(" ")[1];
    console.log("Received Token:", token); // Log the token

    if (!token) {
        console.log("Token missing from authorization header");
        return sendError(res, 401, "Token missing from authorization header");
    }

    try {
        const validToken = verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", validToken); // Check decoded data

        if (!validToken.username || !validToken.id) {
            console.log("Invalid token: Missing username or user ID");
            return sendError(res, 401, "Invalid token: Missing username or user ID");
        }

        // ✅ Allow access for both regular users and admins
        req.user = validToken;
        req.isAdmin = validToken.role === "admin"; // Mark if user is an admin

        console.log(`User Role: ${validToken.role || "user"}`); // Log role for debugging
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return sendError(res, 403, "Invalid or expired token");
    }
};

module.exports = { validateToken };
