const express = require("express");
const wrapAsync = require("../utils/errors/wrapAsync");
const { User } = require("../models/users");
const { UserLostPassword } = require("../models/usersLostPassword");
const { checkIfUserValid } = require("../utils/validation/users");
const { isLoggedIn, isUserPasswordValid } = require("../utils/users/authentification");
const { deleteUser } = require("../utils/data/deletionHelper");
const { existingOrNewConnection } = require("../utils/sql/sql");
const { 
    parseCelebrateError, 
    errorsWithPossibleRedirect, 
    returnHasJSONIfNeeded,
} = require("../utils/errors/celebrateErrorsMiddleware");
const {
    validateEmailUpdate,
    validatePasswordUpdate,
    validateDeleteUser
} = require("../utils/validation/users");
const {
    validateUserRegistration,
    validateUserLogin,
    validateUpdateEmail,
    validatedUpdatePassword,
    validateUpdateUsername,
    validatePassword,
} = require("../utils/validation/htmx/validateUser");
const { ValueError } = require("../utils/errors/exceptions");
const { htmxRedirect } = require("../utils/htmx/htmx");

const router = express.Router();

router.get("/register", function(req, res) {
    if (req.session.user) {
        return htmxRedirect(req, res, "/collections");
    }

    res.locals.activeLink = "UserRegister";
    res.render("partials/htmx/login/register.ejs");
});

router.get("/login", function(req, res) {
    if (req.session.user) {
        return htmxRedirect(req, res, "/collections");
    }

    res.locals.activeLink = "UserLogin";
    res.render("partials/htmx/login/login.ejs");
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

router.post("/register", wrapAsync(async function(req, res) {
    const { 
        username, 
        email, 
        password, 
        "retyped-password": retypedPassword,
        emptySet,
    } = req.body;

    const errorMessages = {};

    const [
        validatedUsername,
        validatedEmail,
        validatedPassword,
        validatedRetypedPassword,
    ] = validateUserRegistration(
        emptySet,
        username,
        email,
        password,
        retypedPassword,
        errorMessages,
    );

    const newUser = await existingOrNewConnection(null, async function(connection) {
        if (Object.keys(errorMessages).length) {
            return;
        }

        if (await User.checkIfItsDuplicate(validatedUsername, validatedEmail, connection)) {
            errorMessages.global = "Credentials already exists";
            return;
        }

        try {
            const newUser = new User(validatedUsername, validatedEmail, validatedPassword);
            await newUser.save(connection);
            return newUser;
        } catch (error) {
            errorMessages.global = error.message;
        }
    });

    if (Object.keys(errorMessages).length) {
        return res.render("partials/htmx/login/register.ejs", {
            registerValue: {
                emptySet,
                username: validatedUsername,
                email: validatedEmail,
                password: validatedPassword,
                retypedPassword: validatedRetypedPassword,
            },
            errorMessages,
        });
    }

    req.session.user = newUser.toBaseObject();
    htmxRedirect(req, res, "/collections");
}));

router.post("/login", wrapAsync(async function(req, res) {
    if (req.session.user) {
        return htmxRedirect(req, res, "/collections");
    }

    const {
        username,
        password,
        emptySet
    } = req.body;

    const errorMessages = {};

    const [
        validatedUsername,
        validatedPassword,
    ] = validateUserLogin(emptySet, username, password, errorMessages);

    const loginUser = await existingOrNewConnection(null, async function(connection) {
        if (Object.keys(errorMessages).length) {
            return;
        }

        const foundUser = await User.findByNameOrEmail(username, connection);

        if (
            !foundUser || 
            !foundUser.compare(username, password)
        ) {
            errorMessages.global = "Invalid Credentials";
            return;
        }

        return foundUser;
    });

    if (Object.keys(errorMessages).length || !loginUser) {
        return res.render("partials/htmx/login/login.ejs", {
            loginValue: {
                emptySet,
                username: validatedUsername,
                password: validatedPassword,
            },
            errorMessages,
        });
    }

    req.session.user = loginUser.toBaseObject();
    htmxRedirect(req, res, "/collections");
}));

router.post("/logout", function(req, res) {
    req.session.user = null;

    htmxRedirect(req, res, "/");
});

router.get("/informations", isLoggedIn, wrapAsync(async function(req, res) {
    if (!req.session.user) {
        return htmxRedirect(req, res, "/");
    }

    const userID = req.session.user.id;

    const foundUser = await User.findByID(userID);
    if (!foundUser || !(foundUser instanceof User || !foundUser.isValid())) {
        req.flash("error", "Failed to found user");
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    res.locals.activeLink = "UserInformations";
    res.render("partials/htmx/login/informations.ejs", {
        user: foundUser,
    });
}));

router.get("/update-username", wrapAsync(async function(req, res) {
    if (!req.session.user) {
        return htmxRedirect(req, res, "/");
    }

    const userID = req.session.user.id;

    const foundUser = await User.findByID(userID);
    if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
        req.flash("error", "Failed to found user");
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    res.locals.activeLink = "UserInformations";
    res.render("partials/htmx/login/edit_username.ejs", {
        editValues: {
            username: foundUser.username,
            password: "",
        },
    });
}));

router.post("/update-username", wrapAsync(async function(req, res) {
    if (!req.session.user) {
        return htmxRedirect(req, res, "/");
    }

    const userID = req.session.user.id;
    const { 
        username, 
        password 
    } = req.body;

    const errorMessages = {};

    const [
        validatedUsername,
        validatedPassword,
    ] = validateUpdateUsername(username, password, errorMessages);

    await existingOrNewConnection(null, async function(connection) {
        if (Object.keys(errorMessages).length) {
            return;
        }

        const foundUser = await User.findByID(userID, connection);

        if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
            errorMessages.global = "Could not find user";
            return;
        }

        if (!foundUser.compare(foundUser.username, validatedPassword)) {
            errorMessages.password = "Invalid Password";
            return;
        }

        if (validatedUsername === foundUser.username) return;

        if (await User.checkIfItsDuplicate(validatedUsername, foundUser.email, connection, foundUser.id)) {
            errorMessages.global = "Username already exists";
            return;
        }

        foundUser.username = validatedUsername;
        await foundUser.save(connection);
    });

    if (Object.keys(errorMessages).length) {
        res.render("partials/htmx/login/edit_username.ejs", {
            editValues: {
                username: validatedUsername,
                password: validatedPassword,
            },
            errorMessages,
        });
    } else {
        htmxRedirect(req, res, "/users/informations");
    }
}));

router.get("/update-email", wrapAsync(async function(req, res) {
    if (!req.session.user) {
        return htmxRedirect(req, res, "/");
    }

    const userID = req.session.user.id;

    const foundUser = await User.findByID(userID);
    if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
        req.flahs("error", "Failed to found user");
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    res.locals.activeLink = "UserInformations";
    res.render("partials/htmx/login/edit_email.ejs", {
        editValues: {
            email: foundUser.email,
            password: "",
        },
    });
}));

router.post("/update-email", wrapAsync(async function(req, res) {
    if (!req.session.user) {
        return htmxRedirect(req, res, "/");
    }

    const userID = req.session.user.id;
    const {
        email,
        password
    } = req.body;

    const errorMessages = {};

    const [
        validatedEmail,
        validatedPassword,
    ] = validateUpdateEmail(email, password, errorMessages);

    await existingOrNewConnection(null, async function(connection) {
        if (Object.keys(errorMessages).length) {
            return;
        }

        const foundUser = await User.findByID(userID, connection);

        if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
            errorMessages.global = "Could not find user";
            return;
        }

        if (!foundUser.compare(foundUser.username, validatedPassword)) {
            errorMessages.password = "Invalid Password";
            return;
        }

        if (await User.checkIfItsDuplicate(foundUser.username, validatedEmail, connection, foundUser.id)) {
            errorMessages.global = "Email already exists";
            return;
        }

        foundUser.email = validatedEmail;
        await foundUser.save(connection);
    });

    if (Object.keys(errorMessages).length) {
        res.render("partials/htmx/login/edit_email.ejs", {
            editValues: {
                email: validatedEmail,
                password: validatedPassword,
            },
            errorMessages,
        });
    } else {
        htmxRedirect(req, res, "/users/informations");
    }
}));

router.get("/update-password", wrapAsync(async function(req, res) {
    if (!req.session.user) {
        return htmxRedirect(req, res, "/");
    }

    const userID = req.session.user.id;

    const foundUser = await User.findByID(userID);
    if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
        req.flahs("error", "Failed to found user");
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    res.locals.activeLink = "UserInformations";
    res.render("partials/htmx/login/edit_password.ejs", {
        editValues: {
            currentPassword: "",
            newPassword: "",
            retypedPassword: "",
        },
    });
}));

router.post("/update-password", wrapAsync(async function(req, res) {
    if (!req.session.user) {
        return htmxRedirect(req, res, "/");
    }

    const userID = req.session.user.id;
    const {
        "current-password": currentPassword,
        "new-password": newPassword,
        "new-retyped-password": retypedPassword,
    } = req.body;

    const errorMessages = {};

    const [
        validatedCurrentPassword,
        validatedNewPassword,
        validatedRetypedPassword,
    ] = validatedUpdatePassword(
        currentPassword, 
        newPassword, 
        retypedPassword, 
        errorMessages
    );

    await existingOrNewConnection(null, async function(connection) {
        if (Object.keys(errorMessages).length) {
            return;
        }

        const foundUser = await User.findByID(userID, connection);

        if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
            errorMessages.flobal = "Could not find user";
            return;
        }

        if (!foundUser.compare(foundUser.username, validatedCurrentPassword)) {
            errorMessages.currentPassword = "Invalid Password";
            return;
        }

        foundUser.setPassword(validatedNewPassword);
        await foundUser.save(connection);
    });

    if (Object.keys(errorMessages).length) {
        res.render("partials/htmx/login/edit_password.ejs", {
            editValues: {
                currentPassword: validatedCurrentPassword,
                newPassword: validatedNewPassword,
                retypedPassword: validatedRetypedPassword,
            },
            errorMessages,
        });
    } else {
        htmxRedirect(req, res, "/users/informations");
    }
}));

router.get("/delete-modal", wrapAsync(async function(req, res) {
    if (!req.session.user) {
        return htmxRedirect(req, res, "/");
    }

    const userID = req.session.user.id;

    const foundUser = await User.findByID(userID);
    if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
        req.flash("error", "Failed to found user");
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    res.locals.activeLink = "UserInformations";
    res.render("partials/htmx/modals/deleteUserModal.ejs", {
        user: foundUser,
        passwordInput: "",
        isValidation: false,
    });
}));

router.delete("/", wrapAsync(async function(req, res) {
    if (!req.session.user) {
        return htmxRedirect(req, res, "/");
    }

    const userID = req.session.user.id;
    const { password } = req.body;

    const errorMessages = {};

    const validatedPassword = validatePassword(password, errorMessages);

    const [errorMessage, foundUser] = await existingOrNewConnection(null, async function(connection) {
        const foundUser = await User.findByID(userID, connection);

        if (Object.keys(errorMessages).length) {
            return [null, foundUser];
        }

        if (!foundUser.compare(foundUser.username, validatedPassword)) {
            errorMessages.password = "Invalid Password";
            return [null, foundUser];
        }

        try {
            await deleteUser(foundUser, connection);
        } catch (err) {
            console.log(err);
            return ["Failed to delete user", foundUser];
        }

        req.session.user = undefined;
        return [null, foundUser];
    });

    if (Object.keys(errorMessages).length) {
        return res.render("partials/htmx/modals/deleteUserModal.ejs", {
            user: foundUser,
            passwordInput: password,
            errorMessages,
            isValidation: true,
        });
    }

    if (errorMessage) {
        req.flash("error", errorMessage);
        res.set({
            "HX-Trigger": "new-flash-event, close-import-from-modal",
        }).status(204).send();
    } else {
        htmxRedirect(req, res, "/");
    }
}));

router.delete("/", isLoggedIn, validateDeleteUser(), isUserPasswordValid, wrapAsync(async function(req, res, next) {
    const { deleteUser: removeUser, password: currentPassword } = req.body;
    const userID = req.session.user.id;
    const username = req.session.user.username;

    if (removeUser !== true) {
        throw new ValueError(400, "Invalid User Deletion Request");
    }

    const [success, error] = await existingOrNewConnection(null, async function(connection) {
        try {
            await deleteUser(userID, connection);
        } catch (e) {
            return [false, { statusCode: 500, message: `Failed to delete user: ${e.message}`}];
        }

        return [true, null];
    });

    if (!success) {
        return next(error);
    }

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
        isUserPasswordValid,
        wrapAsync(async function(req, res, next) {
    const { email/*, password*/ } = req.body;

    const [success, error] = 
            await existingOrNewConnection(null, async function(connection) {
        try {
            const foundUser = await User.findByID(req.session.user.id, connection);

            if (!foundUser || !foundUser instanceof User || !foundUser.isValid()) {
                return [false, { statusCode: 404, message: "User Not Found!" }];
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
        isUserPasswordValid,
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
