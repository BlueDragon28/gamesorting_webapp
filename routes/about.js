const express = require("express");

const router = express.Router();

router.get("/about", function(req, res) {
    res.locals.activeLink = "AboutPage";
    res.render("about.ejs", {
        appVersion: process.env.npm_package_version,
    });
});

module.exports = router;
