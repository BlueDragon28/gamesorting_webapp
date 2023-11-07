const express = require("express");
const { User } = require("../models/users");
const { UserActivity } = require("../models/userActivity");
const { isLoggedIn, isUserPasswordValid } = require("../utils/users/authentification");
const { existingOrNewConnection } = require("../utils/sql/sql");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError, ValueError } = require("../utils/errors/exceptions");
const { returnHasJSONIfNeeded, errorsWithPossibleRedirect } = require("../utils/errors/celebrateErrorsMiddleware");
const bigint = require("../utils/numbers/bigint");
const { deleteUser } = require("../utils/data/deletionHelper");
const { validatePassword } = require("../utils/validation/htmx/validateUser");

const router = express.Router();

function parseCurrentPageHeader(req, res, next) {
    const pageHeader = req.get("GS-currentPage");
    try {
        req.currentPageNumber = Math.max(Number(pageHeader), 1);
        if (typeof req.currentPageNumber !== "number" || isNaN(req.currentPageNumber)) {
            req.currentPageNumber = 1;
        }
    } catch {
        req.currentPageNumber = 1;
    }
    next();
}

async function isUserAdmin(req, res, next) {
    const isUserAdmin = await User.isAdmin(req.session.user.id);

    if (isUserAdmin) {
        if (req.htmx.isHTMX) {
            req.flash("error", "You cannot access this section");
            return res.set({
                "HX-Trigger": "new-flash-event",
            }).status(204).send();
        } else {
            return res.redirect("/");
        }
    }

    next();
}

function divideActivitiesByDays(activities) {
    if (!Array.isArray(activities)) {
        return {
            days: [],
            maxADay: 0,
            total: 0
        };
    }

    const now = Date.now();
    const parsedDate = [];
    const aDayInMilliseconds = 24 * 60 * 60 * 1000;
    let maxActivityADay = 0;
    let totalActivity = 0;

    for (let i = 0; i < 30; i++) {
        const endTime = now - (aDayInMilliseconds * i);
        const startTime = now - (aDayInMilliseconds * (i+1));
        const day = {
            day: i+1,
            activities: 0
        };

        for (const activity of activities) {
            if (activity.time >= startTime && activity.time < endTime) {
                day.activities++;
            }
        }

        parsedDate.push(day);

        if (day.activities > maxActivityADay) {
            maxActivityADay = day.activities;
        }

        totalActivity+= day.activities;
    }

    return {
        days: parsedDate,
        maxADay: maxActivityADay,
        total: totalActivity
    };
}

function activitiesADay(activities) {
    if (!Array.isArray(activities)) {
        return {
            total : 0
        }
    }

    let totalActivity = activities.length;

    return {
        total: totalActivity
    };
}

router.use(isLoggedIn);
router.use(wrapAsync(isUserAdmin));
router.use(function(req, res, next) {
    res.locals.activeLink = "Admin";
    next();
});

router.get("/", function(req, res) {
    res.render("admin/index");
});

router.get("/activities", wrapAsync(async function(req, res) {
    const [activitiesLast30Days, uniqueUsersLast30Days] = 
            await existingOrNewConnection(null, async function(connection) {

        const userActivitesInLast30Days = await UserActivity.findByTimelapsFromNow(30 * 24, connection); // last 30 days
        const uniqueUsersLast30Days = await UserActivity.findUniqueUsersFromTimelaps(30 * 24, 0, connection) // last 30 days;

        return [userActivitesInLast30Days, uniqueUsersLast30Days];
    });
    
    const parsedDateValue = divideActivitiesByDays(activitiesLast30Days);

    res.render("admin/activities", { userActivity: parsedDateValue, uniqueUsers: uniqueUsersLast30Days });
}));

router.get("/activities/byday/:day", wrapAsync(async function(req, res) {
    const dayNumber = parseInt(req.params.day);

    if (dayNumber <= 0 || dayNumber > 30 || isNaN(dayNumber)) {
        throw new ValueError("Invalid day");
    }

    const from = dayNumber > 1 ? 24 * (dayNumber) : 24;
    const to = dayNumber > 1 ? 24 * (dayNumber - 1) : 0;

    const [activities, uniqueUser] = await existingOrNewConnection(null, async function(connection) {
        const userActivities = await UserActivity.findByTimelaps(from, to, connection);
        const uniqueUser = await UserActivity.findUniqueUsersFromTimelaps(from, to, connection);
        return [userActivities, uniqueUser]
    });

    const userActivities = activitiesADay(activities);
    userActivities.dayNumber = dayNumber;

    res.render("admin/activitiesByDay", { userActivities, uniqueUser});
}));

router.get("/users", parseCurrentPageHeader,
    wrapAsync(async function(req, res) {

    const pageNumber = req.currentPageNumber;

    const [users, pagination] = await User.findUsers(pageNumber);

    if (!users || !Array.isArray(users)) {
        throw new InternalError("Failed to Query Users");
    }

    res.render("partials/htmx/admin/usersList.ejs", { users, pagination });
}));

router.get("/users/:userID", wrapAsync(async function(req, res) {
    let userID = req.params.userID;
    const displayOnlyElements = req.get("GS-onlyElements") === "true";

    if (!userID || !bigint.isValid(userID)) {
        throw new ValueError(404, "Invalid user ID");
    }

    userID = bigint.toBigInt(userID);

    const user = await User.findByID(userID);

    if (!user || !user instanceof User || !user.isValid()) {
        throw new ValueError(404, "User not found");
    }

    const isCurrentUser = req.session?.user?.id == user.id;

    res.render("admin/userInfo.ejs", { user, isCurrentUser, displayOnlyElements });
}));

router.get("/users/:userID/bypass-restriction-modal", wrapAsync(async function(req, res) {
    const adminUserID = req.session.user.id;
    const { userID } = req.params;

    const [errorMessage, foundUser] = await existingOrNewConnection(null, async function(connection) {
        const foundAdminUser = await User.findByID(adminUserID, connection);

        if (!foundAdminUser || !(foundAdminUser instanceof User) || !foundAdminUser.isValid()) {
            return ["Could not find current user"];
        }

        if (foundAdminUser.isAdmin !== true) {
            return ["You are not admin"];
        }

        const foundUser = await User.findByID(userID, connection);

        if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
            return ["Could not find user"];
        }

        return [null, foundUser];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event, close-import-from-modal",
        }).status(204).send();
    }
    
    res.render("partials/htmx/modals/bypassingRestrictionsModal.ejs", {
        user: foundUser,
        validationPhase: false,
        editValues: {
            password: "",
        },
    });
}));

router.post("/users/:userID/bypass-restriction", wrapAsync(async function(req, res) {
    const adminUsersID = req.session.user.id;
    const { userID } = req.params;
    const { password } = req.body;

    const errorMessages = {};

    const validatedPassword = validatePassword(
        password,
        errorMessages,
    );

    const [error, foundUser] = await existingOrNewConnection(null, async function(connection) {
        const foundAdminUser = await User.findByID(adminUsersID, connection);

        if (!foundAdminUser || !(foundAdminUser instanceof User) || !foundAdminUser.isValid()) {
            return ["Could not find current user"];
        }

        if (foundAdminUser.isAdmin !== true) {
            return ["You are not admin"];
        }

        const foundUser = await User.findByID(userID, connection);

        if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
            return ["Could not find this user"];
        }

        if (Object.keys(errorMessages).length) {
            return [null, foundUser];
        }

        if (!foundAdminUser.compare(foundAdminUser.username, validatedPassword)) {
            errorMessages.password = "Invalid Password";
            return [null, foundUser];
        }

        foundUser.bypassRestriction = foundUser.bypassRestriction === true ?
            false :
            true;
        await foundUser.save(connection);

        return [null, foundUser];
    });

    if (error) {
        req.flash("error", error);
        return res.set({
            "HX-Trigger": "new-flash-event, close-import-from-modal",
        }).status(204).send();
    }

    if (Object.keys(errorMessages).length) {
        res.render("partials/htmx/modals/bypassingRestrictionsModal.ejs", {
            user: foundUser,
            editValues: {
                password: validatedPassword,
            },
            errorMessages,
            validationPhase: true,
        });
    } else {
        res.set({
            "HX-Trigger": "close-import-from-modal",
            "HX-Location": `{"path":"/admin/users/${foundUser.id}","target":"#admin-user-info-card","swap":"outerHTML","headers":{"GS-onlyElements":"true"}}`,
        }).status(204).send();
    }
}));

router.get("/users/:userID/delete-modal", wrapAsync(async function(req, res) {
    const adminUserID = req.session.user.id;
    const { userID } = req.params;

    const [errorMessage, foundUser] = await existingOrNewConnection(null, async function(connection) {
        const foundAdminUser = await User.findByID(adminUserID, connection);

        if (!foundAdminUser || !(foundAdminUser instanceof User) || !foundAdminUser.isValid()) {
            return ["Could not find current user"];
        }

        if (foundAdminUser.isAdmin !== true) {
            return ["You are not admin"];
        }

        const foundUser = await User.findByID(userID, connection);

        if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
            return ["Could not find user"];
        }

        return [null, foundUser];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event, close-import-from-modal",
        }).status(204).send();
    }

    res.render("partials/htmx/modals/adminDeleteUserModal.ejs", {
        user: foundUser,
        validationPhase: false,
        editValues: {
            password: "",
        },
    });
}));

router.delete("/users/:userID", wrapAsync(async function(req, res) {
    const adminUsersID = req.session.user.id;
    const { userID } = req.params;
    const { password } = req.body;

    const errorMessages = {};

    const validatedPassword = validatePassword(
        password,
        errorMessages,
    );

    const [error, foundUser] = await existingOrNewConnection(null, async function(connection) {
        const foundAdminUser = await User.findByID(adminUsersID, connection);

        if (!foundAdminUser || !(foundAdminUser instanceof User) || !foundAdminUser.isValid()) {
            return ["Could not find current user"];
        }

        if (foundAdminUser.isAdmin !== true) {
            return ["You are not admin"];
        }

        const foundUser = await User.findByID(userID, connection);

        if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
            return ["Could not find this user"];
        }

        if (Object.keys(errorMessages).length) {
            return [null, foundUser];
        }

        if (!foundAdminUser.compare(foundAdminUser.username, validatedPassword)) {
            errorMessages.password = "Invalid Password";
            return [null, foundUser];
        }

        await deleteUser(foundUser, connection);
        return [null, foundUser];
    });

    if (error) {
        req.flash("error", error);
        return res.set({
            "HX-Trigger": "new-flash-event, close-import-from-modal",
        }).status(204).send();
    }

    if (Object.keys(errorMessages).length) {
        res.render("partials/htmx/modals/adminDeleteUserModal.ejs", {
            user: foundUser,
            validationPhase: true,
            editValues: {
                password: validatedPassword,
            },
            errorMessages,
        });
    } else {
        res.set({
            "HX-Trigger": "close-import-from-modal",
            "HX-Location": '{"path":"/admin/users","target":"body","headers":{"HX-Boosted":"true"}}',
        }).status(204).send();
    }
}));

router.use(returnHasJSONIfNeeded);
router.use(errorsWithPossibleRedirect("Oups, something went wrong", "/admin"));

module.exports = router;
