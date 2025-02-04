const express = require("express");
const router = express.Router();
const { Reviews } = require("../models"); // ✅ Import the Reviews model

// Fetch all reviews for a specific event
router.get("/:eventId", async (req, res) => {
    try {
        const eventId = req.params.eventId;

        // Fetch reviews where EventId matches (ensure this matches your DB column name)
        const reviews = await Reviews.findAll({
            where: { EventId: eventId },
            attributes: ["review_text", "rating", "createdAt"], // Fetch only required fields
        });

        if (reviews.length === 0) {
            return res.status(404).json({ error: "No reviews found for this event" });
        }

        res.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

// Post a new review
router.post("/", async (req, res) => {
    try {
        const { review_text, rating, eventId } = req.body; // Ensure correct field name

        // Validate required fields
        if (!review_text || !rating || !eventId) {
            return res.status(400).json({ error: "Missing required fields: review_text, rating, or eventId" });
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        // Create the review
        const newReview = await Reviews.create({ review_text, rating, EventId: eventId });

        res.status(201).json(newReview);
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ error: "Failed to add review" });
    }
});

module.exports = router;
