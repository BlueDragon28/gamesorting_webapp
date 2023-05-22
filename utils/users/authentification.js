const { checkIfUserValid } = require("../validation/users");
const { existingOrNewConnection } = require("../sql/sql");
const { User } = require("../../models/users");
const wrapAsync = require("../errors/wrapAsync");

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

async function isUserPasswordValid(req, res, next) {
    const { password, currentPassword } = req.body;

    const userPassword = typeof password === "string" ? password : typeof currentPassword === "string" ? currentPassword : undefined;

    if (typeof userPassword !== "string") {
        return next({ statusCode: 404, message: "Invalid password!" });
    }

    const [success, error] = await existingOrNewConnection(null, async function(connection) {
        try {
            const foundUser = await User.findByID(req.session.user.id, connection);

            if (!foundUser || !foundUser instanceof User || !foundUser.isValid()) {
                return [false, { statusCode: 404, message: "User Not Found!" }];
            }

            if (!foundUser.compare(foundUser.email, userPassword)) {
                return [false, { statusCode: 404, message: "Invalid password" }];
            }
        } catch (error) {
            return [false, { statusCode: 500, message: error.message }];
        }

        return [true, null];
    });

    if (!success) {
        return next(error);
    }

    next();
}

module.exports = {
    isLoggedIn,
    isUserPasswordValid: wrapAsync(isUserPasswordValid)
};
