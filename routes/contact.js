const express = require("express");

const router = express.Router();

router.get("/contact", async function(req, res) {
    res.render("contact/contact.ejs");
});

module.exports = router;