const express = require("express");
const wrapAsync = require("../utils/errors/wrapAsync");
const { User } = require("../models/users");
const { checkIfUserValid } = require("../utils/validation/users");
const { isLoggedIn } = require("../utils/users/authentification");
const { deleteUser } = require("../utils/data/deletionHelper");
const { existingOrNewConnection } = require("../utils/sql/sql");

const router = express.Router();

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

router.get("/logout", function(req, res) {
    if (!req.session.user || !checkIfUserValid(req.session.user)) {
        req.flash("success", "Already Logged Out");
        return res.redirect("/");
    }

    req.session.user = null;
    req.flash("success", "Successfully Logged Out");
    res.redirect("/");
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

    if (foundUser && !foundUser.compare(username, password) ||
            !foundUser) {
        req.session.user = null;
        req.flash("error", "Invalid Credentials");
        return res.redirect(`${req.baseUrl}/login`);
    }

    req.session.user = foundUser.toBaseObject();

    req.flash("success", "Welcome Back!");
    res.redirect("/collections");
}));

router.get("/informations", isLoggedIn, wrapAsync(async function(req, res) {
    const userID = req.session.user.id;

    const foundUser = await User.findByID(userID);

    res.render("login/userInformations", { user: foundUser });
}));

router.delete("/", isLoggedIn, wrapAsync(async function(req, res) {
    const userID = req.session.user.id;

    await existingOrNewConnection(null, async function(connection) {
        await deleteUser(userID, connection);
    });

    req.session.user = null;

    res.redirect("/");
}));

router.put("/email", isLoggedIn, wrapAsync(async function(req, res) {
    console.log("Hello: put request received");
    console.log(req.body);
}));

module.exports = router;
