const express = require("express");
const router = express.Router();
const { Reviews } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

// Fetch all reviews for a specific event
router.get("/:id", async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);

        if (isNaN(eventId) || eventId <= 0) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        const reviews = await Reviews.findAll({
            where: { eventId },
            attributes: ["id", "review_text", "rating", "username", "createdAt"],
            order: [["createdAt", "DESC"]],
        });

        if (!reviews.length) {
            return res.status(404).json({ error: "No reviews found for this event" });
        }

        res.json(reviews);
    } catch (error) {
        console.error("Database error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Post a new review
router.post("/", validateToken, async (req, res) => {
    try {
        const { review_text, rating, eventId } = req.body;
        const userId = req.user.id;
        const username = req.user.username; // Extract username from token

        if (!review_text || !rating || !eventId || isNaN(eventId)) {
            return res.status(400).json({ error: "Missing or invalid fields" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        const existingReview = await Reviews.findOne({ where: { eventId, UserId: userId } });

        if (existingReview) {
            return res.status(400).json({ error: "You have already reviewed this event." });
        }

        const newReview = await Reviews.create({
            review_text,
            rating,
            eventId,
            UserId: userId,
            username, // Store the username in the database
        });

        return res.status(201).json({
            message: "Review added successfully",
            review: { id: newReview.id, review_text, rating, eventId, username },
        });
    } catch (error) {
        console.error("Error adding review:", error);
        return res.status(500).json({ error: "There was an error adding your review. Please try again." });
    }
});


module.exports = router;
