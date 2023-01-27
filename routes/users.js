const express = require("express");
const wrapAsync = require("../utils/errors/wrapAsync");
const { User } = require("../models/users");
const bigint = require("../utils/numbers/bigint");

const router = express.Router();

function checkIfUserValid(user) {
    return  user && bigint.isValid(user.id) && 
            typeof user.username === "string" && user.username.length &&
            typeof user.email === "string" && user.email.length;
}

router.get("/register", function(req, res) {
    res.render("login/register");
});

router.get("/login", function(req, res) {
    if (req.session.user && checkIfUserValid(req.session.user)) {
        req.flash("success", "Already Logged In");
        return res.redirect("/collections");
    }

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

    if (foundUser && !foundUser.compare(username, password)) {
        req.session.user = null;
        req.flash("error", "Invalid Credentials");
        console.log("error");
        return res.redirect(`${req.baseUrl}/login`);
    }

    req.session.user = foundUser.toBaseObject();

    req.flash("success", "Welcome Back!");
    res.redirect("/collections");
}));

module.exports = router;
