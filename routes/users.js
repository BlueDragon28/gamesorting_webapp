const express = require("express");
const wrapAsync = require("../utils/errors/wrapAsync");
const { User } = require("../models/users");

const router = express.Router();

router.get("/register", function(req, res) {
    res.render("login/register");
});

router.get("/login", function(req, res) {
    res.render("login/index");
});

router.post("/register", wrapAsync(async function(req, res) {
    const { username, email, password } = req.body.user;
    const user = new User(username, email, password);
    await user.save();
    res.redirect("/");
}));

router.post("/login", wrapAsync(async function(req, res) {
    const { username, password } = req.body.user;
    const foundUser = await User.findByNameOrEmail(username);
    if (foundUser.compare(username, password)) {
        console.log("SUCCESS!!!");
    } else {
        console.log("FAILURE!!!");
    }
    res.redirect("/");
}));

module.exports = router;
