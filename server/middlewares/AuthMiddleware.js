const { verify } = require("jsonwebtoken");

const validateToken = (req, res, next) => {
    const accessToken = req.header("Authorization")?.split(" ")[1]; // Extract Bearer token

    if (!accessToken) {
        return res.status(401).json({ error: "User not authenticated" });
    }

    try {
        const validToken = verify(accessToken, process.env.JWT_SECRET || "defaultsecret");

        if (!validToken.id) {
            return res.status(403).json({ error: "Invalid token payload" });
        }

        req.user = validToken; // Attach user info
        console.log("User verified:", req.user); // Logging to ensure user is set
        return next();
    } catch (err) {
        return res.status(403).json({ error: "Token is not valid" });
    }
};

module.exports = { validateToken };
