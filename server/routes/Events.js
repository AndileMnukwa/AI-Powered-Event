const express = require("express");
const router = express.Router();
const { Events, Reviews, Users } = require("../models"); // Ensure Users model is imported if needed elsewhere, added it just in case
const { validateToken } = require("../middlewares/AuthMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize"); // Import Op for potential future use if needed

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "./uploads/events";
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `event-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const mimetype = fileTypes.test(file.mimetype);
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Only image files are allowed!"));
    }
});

// --- MODIFIED ROUTE: Fetch all events WITH review stats ---
router.get("/", async (req, res) => {
    try {
        const events = await Events.findAll({
            include: [{
                model: Reviews,
                attributes: ['rating', 'sentiment'] // Only fetch necessary review attributes
            }],
             order: [['date', 'DESC']] // Optional: Order events if needed
        });

        // Process events to add calculated review statistics
        const enhancedEvents = events.map(event => {
            const plainEvent = event.toJSON(); // Convert to plain object to add properties
            const reviews = plainEvent.Reviews || []; // Access included reviews

            // Calculate reviewCount
            plainEvent.reviewCount = reviews.length;

            // Calculate avgRating
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
                plainEvent.avgRating = parseFloat((totalRating / reviews.length).toFixed(1));
            } else {
                plainEvent.avgRating = 0;
            }

            // Calculate sentimentScore (% positive)
            if (reviews.length > 0) {
                const positiveReviews = reviews.filter(review => review.sentiment === 'positive').length;
                plainEvent.sentimentScore = Math.round((positiveReviews / reviews.length) * 100);
            } else {
                plainEvent.sentimentScore = 0;
            }

            // Remove the included Reviews array from the final output as it's not needed by AIReviewsPage list view
            delete plainEvent.Reviews;

            return plainEvent;
        });

        res.json(enhancedEvents); // Send the enhanced list

    } catch (error) {
        console.error("Error fetching events with review stats:", error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});
// --- END OF MODIFIED ROUTE ---

// Create a new event (Requires Authentication) - No changes needed
router.post("/", validateToken, upload.single("image"), async (req, res) => {
    try {
        console.log("Received Event Data:", req.body); // Debugging

        const {
            title,
            location,
            description,
            date,
            time,
            category,
            isPaid,
            price,
            ticketsAvailable,
            registrationDeadline,
            maxRegistrations,
            minRegistrations,
            status
        } = req.body;

        // Validate required fields
        if (!title || !location || !description || !date || !time || !category) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Create new event object
        const newEventData = {
            title,
            location,
            description,
            date,
            time,
            category,
            username: req.user.username, // Use username from validated token
            userId: req.user.id, // Store userId as well
            isPaid: isPaid === 'true' || isPaid === true,
            price: isPaid === 'true' || isPaid === true ? parseFloat(price) : 0,
            ticketsAvailable: parseInt(ticketsAvailable || 100),
            registrationDeadline: registrationDeadline || null,
            maxRegistrations: maxRegistrations ? parseInt(maxRegistrations) : null,
            minRegistrations: parseInt(minRegistrations || 1),
            status: status || 'active'
        };

        // Add image path if an image was uploaded
        if (req.file) {
            newEventData.image = `/uploads/events/${req.file.filename}`;
        }

        const newEvent = await Events.create(newEventData);

        res.status(201).json(newEvent);
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ error: "Failed to create event" });
    }
});

// Fetch specific event details and its reviews - No changes needed here for AIReviewsPage, but kept for individual event view
router.get("/:eventId", async (req, res) => {
    try {
        const eventId = req.params.eventId;

        if (!eventId || isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        const event = await Events.findByPk(eventId, {
             // Include organizer details if needed
             include: [{
                model: Users,
                as: 'organizer', // Use the alias defined in your Events model association
                attributes: ['id', 'username'] // Select only necessary user fields
             }]
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        const reviews = await Reviews.findAll({
            where: { EventId: eventId },
            attributes: ["id", "review_text", "rating", "username", "createdAt", "sentiment", "admin_response"],
            order: [['createdAt', 'DESC']] // Optional: Order reviews
        });

        res.json({ event, reviews });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ error: "Failed to fetch event" });
    }
});

// Update an event (Requires Authentication & Ownership) - No changes needed
router.put("/:eventId", validateToken, upload.single("image"), async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await Events.findByPk(eventId);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Ensure that only the event creator or an admin can update it
        // Compare ID from token with userId associated with the event
        if (event.userId !== req.user.id && !req.user.isAdmin) {
             return res.status(403).json({ error: "You are not authorized to update this event" });
        }


        const {
            title,
            location,
            description,
            date,
            time,
            category,
            isPaid,
            price,
            ticketsAvailable,
            registrationDeadline,
            maxRegistrations,
            minRegistrations,
            status
        } = req.body;

        // Update event data
        const updateData = {
            title: title || event.title,
            location: location || event.location,
            description: description || event.description,
            date: date || event.date,
            time: time || event.time,
            category: category || event.category,
            isPaid: isPaid === 'true' || isPaid === true,
            price: isPaid === 'true' || isPaid === true ? parseFloat(price) : event.price, // Keep old price if isPaid not true
            ticketsAvailable: ticketsAvailable ? parseInt(ticketsAvailable) : event.ticketsAvailable,
            registrationDeadline: registrationDeadline || event.registrationDeadline,
            maxRegistrations: maxRegistrations ? parseInt(maxRegistrations) : event.maxRegistrations,
            minRegistrations: minRegistrations ? parseInt(minRegistrations) : event.minRegistrations,
            status: status || event.status
        };

        // Update image if a new one was uploaded
        if (req.file) {
            // Delete old image if exists
            if (event.image) {
                const oldImagePath = path.join(__dirname, '..', event.image);
                if (fs.existsSync(oldImagePath)) {
                     try {
                       fs.unlinkSync(oldImagePath);
                     } catch (unlinkErr) {
                       console.error("Error deleting old image:", unlinkErr);
                       // Decide if you want to proceed even if old image deletion fails
                     }
                }
            }
            updateData.image = `/uploads/events/${req.file.filename}`;
        }

        await Events.update(updateData, { where: { id: eventId } });

        const updatedEvent = await Events.findByPk(eventId);
        res.json(updatedEvent);
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: "Failed to update event" });
    }
});

// Delete an event (Requires Authentication & Ownership) - No changes needed
router.delete("/:eventId", validateToken, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await Events.findByPk(eventId);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Ensure that only the event creator or an admin can delete it
        if (event.userId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ error: "You are not authorized to delete this event" });
        }


        // Delete associated image if it exists
        if (event.image) {
            const imagePath = path.join(__dirname, '..', event.image);
            if (fs.existsSync(imagePath)) {
                 try {
                   fs.unlinkSync(imagePath);
                 } catch (unlinkErr) {
                   console.error("Error deleting event image:", unlinkErr);
                   // Decide if you want to proceed even if image deletion fails
                 }
            }
        }

        await Events.destroy({ where: { id: eventId } });
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
});

// Serve static event images - No changes needed
router.get("/images/:filename", (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, "../uploads/events", filename);

    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({ error: "Image not found" });
    }
});

module.exports = router;