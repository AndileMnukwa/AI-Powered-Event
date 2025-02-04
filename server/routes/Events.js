const express = require("express");
const router = express.Router();
const { Events, Reviews } = require("../models"); // ✅ Import both models

// Fetch all events
router.get("/", async (req, res) => {
    try {
        const events = await Events.findAll();
        res.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

router.post("/", async (req, res) => {
    try {
        console.log("Received Event Data:", req.body); // Debug
        const newEvent = await Events.create(req.body);
        res.status(201).json(newEvent);
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ error: "Failed to create event" });
    }
});


// Fetch a specific event by ID along with its reviews
router.get("/:eventId", async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await Events.findByPk(eventId, {
            attributes: ['id', 'title', 'location', 'description', 'date', 'username']  // Make sure you're fetching all necessary fields
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Fetch reviews associated with this event
        const reviews = await Reviews.findAll({
            where: { EventId: eventId },
            attributes: ['review_text', 'rating', 'createdAt'],
        });

        // Send the event along with reviews (even if reviews is empty)
        res.json({ event, reviews: reviews.length > 0 ? reviews : [] });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ error: "Failed to fetch event" });
    }
});

module.exports = router;
