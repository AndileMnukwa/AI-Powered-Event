const express = require('express');
const router = express.Router();
const Events = require('../models/Events');

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Events.getAllEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const event = await Events.createEvent(req.body);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;