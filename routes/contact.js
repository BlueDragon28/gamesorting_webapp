const express = require("express");
const wrapAsync = require("../utils/errors/wrapAsync");
const { validateContactMessage } = require("../utils/validation/contactEmailValidation");
const { sendContactMessage } = require("../utils/email/email");

const router = express.Router();

router.get("/contact", async function(req, res) {
    res.render("contact/contact.ejs");
});

router.post("/contact", validateContactMessage(), wrapAsync(async function(req, res) {
    const { from, object, message } = req.body;

    await sendContactMessage(from, object, message);

    res.redirect("/");
}));

module.exports = router;