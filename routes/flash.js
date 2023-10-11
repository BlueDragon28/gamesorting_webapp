const express = require("express");
const flash = require("connect-flash");
const { isLoggedIn } = require("../utils/users/authentification");

const router = express.Router();

router.use(isLoggedIn);

router.get("/", function(req, res) {
    res.render("partials/flashMessagesRendering.ejs", {
        flashMessages: {
            success: req.flash("success"),
            errors: req.flash("error"),
        },
    });
});

module.exports = router;
