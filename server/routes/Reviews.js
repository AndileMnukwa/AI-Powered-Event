const express = require(`express`);
const router = express.Router();
const { Reviews } = require("../models");

router.get('/', async (req, res) => {
    const listOfReviews = await Reviews.findAll();
    res.json(listOfReviews);
});

router.post("/", async (req, res) => {
    const post = req.body;
    await Reviews.create(post);
    res.json(post);
});

module.exports = router;
