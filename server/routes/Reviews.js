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
            order: [["createdAt", "DESC"]]
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
        const userId = req.user?.id;
        const username = req.user?.username;

        console.log("Incoming request body:", req.body);
        console.log("User object from token:", req.user);

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

        // Check if the user has already reviewed the event
        const existingReview = await Reviews.findOne({ where: { eventId, userId } });

        if (existingReview) {
            return res.status(400).json({ error: "You have already reviewed this event." });
        }

        // Create new review
        const newReview = await Reviews.create({
            review_text,
            rating,
            eventId,
            userId,
            username
        });

        console.log("New review created:", newReview);

        return res.status(201).json({
            message: "Review added successfully",
            review: { id: newReview.id, review_text, rating, eventId, username },
        });
    } catch (error) {
        console.error("Error adding review:", error.message);
        return res.status(500).json({ error: "There was an error adding your review. Please try again." });
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
        const deletedCount = await Reviews.destroy({ where: { id: reviewId, userId } });

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
