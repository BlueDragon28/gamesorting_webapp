const express = require("express");
const wrapAsync = require("../utils/errors/wrapAsync");
const { User } = require("../models/users");
const { UserLostPassword } = require("../models/usersLostPassword");
const { checkIfUserValid } = require("../utils/validation/users");
const { isLoggedIn } = require("../utils/users/authentification");
const { deleteUser } = require("../utils/data/deletionHelper");
const { existingOrNewConnection } = require("../utils/sql/sql");
const { 
    parseCelebrateError, 
    errorsWithPossibleRedirect, 
    returnHasJSONIfNeeded,
    flashJoiErrorMessage
} = require("../utils/errors/celebrateErrorsMiddleware");
const {
    validateRegisteringUser,
    validateLoginUser,
    validateEmailUpdate,
    validatePasswordUpdate,
    validateLostPasswordUpdate
} = require("../utils/validation/users");
const { ValueError } = require("../utils/errors/exceptions");
const { sendLostPasswordEmail } = require("../utils/email/email");

const router = express.Router();

router.get("/register", function(req, res) {
    res.locals.activeLink = "UserRegister";
    res.render("login/register");
});

router.get("/login", function(req, res) {
    if (req.session.user && checkIfUserValid(req.session.user)) {
        req.flash("success", "Already Logged In");
        return res.redirect("/collections");
    }

    res.locals.activeLink = "UserLogin";

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

router.get("/lostpassword", function(req, res) {
    if (req.session.user && checkIfUserValid(req.session.user)) {
        req.flash("success", "Already logged in");
        return res.redirect("/collections");
    }

    res.render("login/lostPassword");
});

router.get("/lostpassword/:tokenID", wrapAsync(async function(req, res) {
    const { tokenID } = req.params;

    const [tokenData, isFound, isRecent] = await existingOrNewConnection(null, async function(connection) {
        const lostUserData = await UserLostPassword.findByToken(tokenID, connection);

        return [
            lostUserData, 
            (lostUserData instanceof UserLostPassword && lostUserData.isValid()),
            (lostUserData instanceof UserLostPassword && lostUserData.isRecent())
        ];
    });

    if (!isFound || !isRecent) {
        req.flash("error", "Invalid token");
        return res.redirect("/");
    } 

    res.render("login/createNewPasswordOnLoss", { tokenID });
}),
errorsWithPossibleRedirect("Invalid token", "/"));

router.post("/register", validateRegisteringUser(), wrapAsync(async function(req, res) {
    const { username, email, password } = req.body.user;
    const user = new User(username, email, password);
    await user.save();
    res.redirect("/users/login");
}),
    parseCelebrateError,
    errorsWithPossibleRedirect("Invalid credentials", "/users/register"));

router.post("/login", validateLoginUser(), wrapAsync(async function(req, res) {
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
}),
    parseCelebrateError,
    errorsWithPossibleRedirect("Invalid credentials", "/users/login"));

router.get("/informations", isLoggedIn, wrapAsync(async function(req, res) {
    const userID = req.session.user.id;

    const foundUser = await User.findByID(userID);

    res.locals.activeLink = "UserInformations"; // Activate user information navlink

    res.render("login/userInformations", { user: foundUser });
}));

router.post("/lostpassword", wrapAsync(async function(req, res) {
    const { email } = req.body;

    await existingOrNewConnection(null, async function(connection) {
        const foundUser = await User.findByNameOrEmail(email, connection);

        if (!foundUser || !foundUser instanceof User || !foundUser.isValid()) {
            return;
        }

        const lostUser = new UserLostPassword(foundUser);

        await sendLostPasswordEmail(foundUser.email, 
            `${process.env.DOMAINE_NAME}/users/lostpassword/${lostUser.token}`);

        await lostUser.save(connection);
    });

    res.redirect("/");
}));

router.post("/lostpassword/:tokenID", validateLostPasswordUpdate(),  wrapAsync(async function(req, res) {
    const { tokenID } = req.params;
    const { password, retypedPassword } = req.body;

    if (!password?.length || retypedPassword !== password) {
        req.flash("error", "Password must be the same");
        return res.redirect(`/users/lostpassword/${tokenID}`);
    }

    try {
        await existingOrNewConnection(null, async function(connection) {
            const tokenData = await UserLostPassword.findByToken(tokenID, connection);

            if (!tokenData || !tokenData?.isValid() || !tokenData?.parentUser || !tokenData?.parentUser?.isValid() || !tokenData?.isRecent()) {
                throw new Error();
            }

            const user = tokenData.parentUser;
            user.setPassword(password);
            await user.save(connection);
            await tokenData.delete(connection);
        });
    } catch (error) {
        req.flash(error, "Invalid token");
        return res.redirect("/");
    }

    req.flash("success", "Password updated successfully");
    res.redirect("/users/login");
}), parseCelebrateError, function(err, req, res, next) {
    if (err.name === "ValidationError") {
        flashJoiErrorMessage(err, req);
        return res.redirect(req.originalUrl);
    }

    next(err);
});

router.delete("/", isLoggedIn, wrapAsync(async function(req, res) {
    const { deleteUser: removeUser } = req.body;
    const userID = req.session.user.id;
    const username = req.session.user.username;

    if (removeUser !== true) {
        throw new ValueError(400, "Invalid User Deletion Request");
    }

    await existingOrNewConnection(null, async function(connection) {
        await deleteUser(userID, connection);
    });

    req.session.user = null;

    req.flash("success", `Successfully delete user ${username}!`);
    res.set("Content-type", "application/json")
        .send({
            type: "SUCCESS",
            message: `Successfully delete user ${username}!`
        });
}));

router.put("/email", 
        isLoggedIn, 
        validateEmailUpdate(), 
        wrapAsync(async function(req, res, next) {
    const { email, password } = req.body;

    const [success, error] = 
            await existingOrNewConnection(null, async function(connection) {
        try {
            const foundUser = await User.findByID(req.session.user.id, connection);

            if (!foundUser || !foundUser instanceof User || !foundUser.isValid()) {
                return [false, { statusCode: 404, message: "User Not Found!" }];
            }

            if (!foundUser.compare(foundUser.email, password)) {
                return [false, { statusCode: 404, message: "Invalid password" }];
            }

            foundUser.email = email;

            await foundUser.save(connection);

            return [true, null];
        } catch (error) {
            return [false, {statusCode: 500, message: error.message}];
        }
    })

    if (!success) {
        return next(error);
    }

    res.set("Content-type", "application/json")
        .send({
        type: "SUCCESS",
        message: "Email updated successfully",
        email
    });
}));

router.put("/password", 
        isLoggedIn, 
        validatePasswordUpdate(), 
        wrapAsync(async function(req, res, next) {
    const { currentPassword, newPassword, retypedPassword } = req.body;

    const [success, error] = await existingOrNewConnection(null, async function(connection) {
        if (!currentPassword.length) {
            return [false, { statusCode: 400, message: "Invalid Current Password" }];
        }

        if (!newPassword.length) {
            return [false, { statusCode: 400, message: "Invalid New Password" }];
        }

        if (newPassword !== retypedPassword) {
            return [false, { statusCode: 400, message: "The Passwords Are Not The Same" }];
        }

        try {
            const foundUser = await User.findByID(req.session.user.id, connection);

            if (!foundUser || !foundUser instanceof User || !foundUser.isValid()) {
                return [false, { statusCode: 404, message: "User Not Found!" }];
            }

            if (!foundUser.compare(foundUser.username, currentPassword)) {
                return [false, { statusCode: 400, message: "Invalid Current Password" }];
            }

            foundUser.setPassword(newPassword);

            await foundUser.save(connection);

            return [true, null];
        } catch (error) {
            return [false, { 
                statusCode: 500, 
                message: `Oups!!! An Error Occured: ${error.message}` 
            }];
        }
    });

    if (!success) {
        return next(error);
    }

    res.set("Content-type", "application/json")
        .send({
        type: "SUCCESS",
        message: "Password updated successfully"
    });
}));

router.use(parseCelebrateError);
router.use(returnHasJSONIfNeeded);
router.use(errorsWithPossibleRedirect("Invalid User"));

module.exports = router;
