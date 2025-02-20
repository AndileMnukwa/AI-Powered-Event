const express = require("express");
const router = express.Router();
const { Reviews, Events, Users } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const Sentiment = require("sentiment");

// Post a new review **with sentiment stored in the database**
router.post("/", validateToken, async (req, res) => {
    try {
        const { review_text, rating, eventId } = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;

        // Validation checks
        if (!userId || !username) {
            return res.status(401).json({ error: "Unauthorized: User not found" });
        }
        if (!review_text || !rating || !eventId || isNaN(eventId)) {
            return res.status(400).json({ error: "Missing or invalid fields" });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        // Perform sentiment analysis
        const sentimentAnalyzer = new Sentiment();
        const result = sentimentAnalyzer.analyze(review_text); // Analyzing the review text
        console.log("Sentiment result:", result); // Log sentiment result for debugging

        let sentimentCategory = "neutral"; // Default category
        if (result.score > 0) {
            sentimentCategory = "positive";
        } else if (result.score < 0) {
            sentimentCategory = "negative";
        }

        // Check if the user has already reviewed the event
        const existingReview = await Reviews.findOne({ where: { EventId: eventId, UserId: userId } });

        if (existingReview) {
            return res.status(400).json({ error: "You have already reviewed this event." });
        }

        // Create new review **with sentiment stored**
        const newReview = await Reviews.create({
            review_text,
            rating,
            EventId: eventId, // Ensure correct field name
            UserId: userId, // Ensure correct field name
            username,
            sentiment: sentimentCategory, // Store sentiment
        });

        return res.status(201).json({
            message: "Review added successfully",
            review: {
                id: newReview.id,
                review_text,
                rating,
                eventId,
                username,
                sentiment: newReview.sentiment, // Now stored in the database
            },
        });
    } catch (error) {
        console.error("Error adding review:", error.message);
        return res.status(500).json({ error: "There was an error adding your review. Please try again." });
    }
});

// Get event details and reviews
router.get("/:eventId", async (req, res) => {
    try {
        const { eventId } = req.params;

        // Fetch event details
        const event = await Events.findByPk(eventId);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Fetch reviews for the event
        const reviews = await Reviews.findAll({
            where: { EventId: eventId },
            include: [{
                model: Users,
                attributes: ['username']
            }],
            order: [['createdAt', 'DESC']], // Fetch latest reviews first
        });

        return res.status(200).json({ event, reviews });
    } catch (error) {
        console.error("Error fetching event details and reviews:", error.message);
        return res.status(500).json({ error: "There was an error fetching event details and reviews. Please try again." });
    }
});

// Delete a review
router.delete("/:reviewId", validateToken, async (req, res) => {
    const reviewId = parseInt(req.params.reviewId, 10);
    const userId = req.user?.id;

    try {
        if (isNaN(reviewId) || reviewId <= 0) {
            return res.status(400).json({ error: "Invalid review ID" });
        }

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: User not found" });
        }

        // Delete the review directly
        const deletedCount = await Reviews.destroy({ where: { id: reviewId, UserId: userId } });

        if (deletedCount === 0) {
            return res.status(404).json({ error: "Review not found or not owned by user" });
        }

        return res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Error deleting review:", error.message);
        return res.status(500).json({ error: "There was an error deleting the review. Please try again." });
    }
});

module.exports = router;
