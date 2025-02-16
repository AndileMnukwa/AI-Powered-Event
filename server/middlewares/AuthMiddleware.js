const { verify } = require("jsonwebtoken");

const validateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
        console.log("Authorization header missing");
        return res.status(401).json({ error: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Received Token:", token); // Log the token

    if (!token) {
        console.log("Token missing from authorization header");
        return res.status(401).json({ error: "Token missing from authorization header" });
    }

    try {
        const validToken = verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", validToken); // Check decoded data

        if (!validToken.username || !validToken.id) {
            console.log("Invalid token: Missing username or user ID");
            return res.status(401).json({ error: "Invalid token: Missing username or user ID" });
        }

        req.user = validToken;
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

module.exports = { validateToken };
