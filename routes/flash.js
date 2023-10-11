const express = require("express");
const flash = require("connect-flash");
const { isLoggedIn } = require("../utils/users/authentification");

const router = express.Router();

router.use(isLoggedIn);

router.get("/", function(req, res) {
    req.flash("success", "hello");
    req.flash("success", "there");
    req.flash("error", "something went");
    req.flash("error", "terribly wrong!");

    res.render("partials/flashMessagesRendering.ejs", {
        flashMessages: {
            success: req.flash("success"),
            errors: req.flash("error"),
        },
    });
});

module.exports = router;
