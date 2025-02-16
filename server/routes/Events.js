const express = require("express");
const router = express.Router();
const { Events, Reviews } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

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

// Create a new event (Requires Authentication)
router.post("/", validateToken, async (req, res) => {
    try {
        console.log("Received Event Data:", req.body); // Debugging

        const { title, location, description, date } = req.body;
        if (!title || !location || !description || !date) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        req.body.username = req.user.username;
        const newEvent = await Events.create({
            title,
            location,
            description,
            date,
            username: req.user.username, // ✅ Assign username from token
        });

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
            attributes: ["id", "title", "location", "description", "date", "username"],
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Fetch reviews associated with this event
        const reviews = await Reviews.findAll({
            where: { eventId },
            attributes: ["id", "review_text", "rating", "username", "createdAt"], // Include username
        });

        res.json({ event, reviews });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ error: "Failed to fetch event" });
    }
});

// Delete an event (Requires Authentication & Ownership)
router.delete("/:eventId", validateToken, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await Events.findByPk(eventId);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Ensure that only the event creator can delete it
        if (event.username !== req.user.username) {
            return res.status(403).json({ error: "You are not authorized to delete this event" });
        }

        await Events.destroy({ where: { id: eventId } });
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
});

module.exports = router;
