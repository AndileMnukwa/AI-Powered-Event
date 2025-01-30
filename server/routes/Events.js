const express = require(`express`)
const router = express.Router();
const { Events } = require("../models");

router.get('/', async(req, res) => {
    const listOfEvents = await Events.findAll();
    res.json(listOfEvents);
});

router.post("/", async (req, res) => {
    const post = req.body
   await Events.create(post);
    res.json(post);
})

module.exports = router;