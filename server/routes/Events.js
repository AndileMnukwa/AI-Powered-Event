const express = require("express");
const router = express.Router();
const { Events } = require("../models");

// Fetch all events
router.get("/", async (req, res) => {
    try {
        const listOfEvents = await Events.findAll();
        res.json(listOfEvents);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

// Fetch a single event by ID
router.get('/byId/:id', async (req, res) => { // ✅ Fixed route syntax
    try {
        const id = req.params.id;
        const event = await Events.findByPk(id); // ✅ Corrected model reference
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch event" });
    }
});

// Create a new event
router.post("/", async (req, res) => {
    try {
        const { title, date, location, description, username } = req.body; // ✅ Fixed field names

        // Validate required fields
        if (!title || !date || !location || !description || !username) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Create the event
        const newEvent = await Events.create({ title, date, location, description, username }); // ✅ Use correct names
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ error: "Failed to create event", details: error.message });
    }
});


module.exports = router;
