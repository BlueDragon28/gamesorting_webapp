const { checkIfUserValid } = require("../validation/users");

/*
Check if the user is logged in. If not, redirect him to the loggin page
*/
function isLoggedIn(req, res, next) {
    if (!req.session.user || !checkIfUserValid(req.session.user)) {
        req.flash("error", "You Need To Be LoggedIn");
        return res.redirect("/users/login");
    }

    next();
}

module.exports = {
    isLoggedIn
}
