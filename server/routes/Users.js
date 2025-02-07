const express = require("express");
const router = express.Router();
const { Users } = require("../models");
const bcrypt = require("bcrypt");
const { sign } = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET || "defaultsecret";

// Helper function for sending error responses
const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({ error: message });
};

// Register a new user
router.post("/", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user already exists
        const existingUser = await Users.findOne({ where: { username } });
        if (existingUser) {
            return sendError(res, 400, "Username already taken");
        }

        // Hash password before storing it
        const hash = await bcrypt.hash(password, 10);

        const newUser = await Users.create({ username, password: hash });

        return res.json({ message: "SUCCESS", user: newUser });
    } catch (error) {
        console.error("Registration error:", error);
        return sendError(res, 500, "Server error");
    }
});

// Login user
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await Users.findOne({ where: { username } });

        if (!user) {
            return sendError(res, 401, "User doesn't exist");
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return sendError(res, 401, "Wrong Username and Password Combination");
        }

        const accessToken = sign({ username: user.username, id: user.id }, SECRET_KEY, { expiresIn: "1h" });

        return res.json({ token: accessToken, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error("Login error:", error);
        return sendError(res, 500, "Server error");
    }
});

module.exports = router;
