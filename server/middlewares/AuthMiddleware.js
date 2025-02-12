const { verify } = require("jsonwebtoken");

const validateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
        return res.status(401).json({ error: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: "Token missing from authorization header" });
    }

    try {
        const validToken = verify(token, process.env.JWT_SECRET); // Use env variable for security
        req.user = validToken; // Attach decoded token data to request

        console.log("Decoded Token:", validToken);

        if (!req.user.username || !req.user.id) {
            return res.status(401).json({ error: "Invalid token: Missing username or user ID" });
        }

        return next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

module.exports = { validateToken };
