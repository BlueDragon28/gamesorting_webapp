const express = require("express");
const { User } = require("../models/users");
const { UserActivity } = require("../models/userActivity");
const { isLoggedIn, isUserPasswordValid } = require("../utils/users/authentification");
const { existingOrNewConnection } = require("../utils/sql/sql");
const wrapAsync = require("../utils/errors/wrapAsync");
const Pagination = require("../utils/sql/pagination");
const { InternalError, ValueError } = require("../utils/errors/exceptions");
const { returnHasJSONIfNeeded, errorsWithPossibleRedirect } = require("../utils/errors/celebrateErrorsMiddleware");

const router = express.Router();

async function isUserAdmin(req, res, next) {
    const isUserAdmin = await User.isAdmin(req.session.user.id);

    if (!isUserAdmin) {
        req.flash("error", "You cannot access this section");
        return res.redirect("/");
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
            if (activity.time >= startTime && activity.time <= endTime) {
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

router.get("/users", Pagination.parsePageNumberMiddleware,
    wrapAsync(async function(req, res) {

    const pageNumber = req.query.pn;

    const [users, pagination] = await User.findUsers(pageNumber);

    if (!users || !Array.isArray(users)) {
        throw new InternalError("Failed to Query Users");
    }

    res.render("admin/usersControl.ejs", { users, pagination });
}));

router.get("/users/:userID", wrapAsync(async function(req, res) {
    const userID = parseInt(req.params.userID);

    if (!userID || typeof userID !== "number" || isNaN(userID)) {
        throw new ValueError(404, "Invalid user ID");
    }

    const user = await User.findByID(userID);

    if (!user || !user instanceof User || !user.isValid()) {
        throw new ValueError(404, "User not found");
    }

    res.render("admin/userInfo.ejs", { user });
}));

router.post("/users/:userID/bypass-restriction", isUserPasswordValid, 
        wrapAsync(async function(req, res) {
    const { bypass } = req.body;
    const userID = parseInt(req.params.userID);

    if (!userID || typeof userID !== "number" || isNaN(userID)) {
        return res.set("Content-type", "application/json")
            .status(400)
            .send({
                type: "ERROR",
                message: "Invalid user id"
            });
    }

    if (bypass !== true && bypass !== false) {
        return res.set("Content-type", "application/json")
            .status(400)
            .send({
                type: "ERROR",
                message: "Invalid request"
            });
    }

    const [success, error] = await existingOrNewConnection(null, async function(connection) {
        try {
            const user = await User.findByID(userID, connection);

            user.bypassRestriction = bypass;

            if (!user.isValid()) {
                throw new Error("Invalid user action");
            }

            await user.save(connection);
        } catch (error) {
            return [false, {statusCode: 500, message: `Failed to make user bypass/not bypass restrictions: ${error.message}`}];
        }

        return [true, null];
    });

    if (!success) {
        return next(error);
    }

    const successMessage = "Successfully updated bypass restriction";
    req.flash("success", successMessage);
    res.set("Content-type", "application/json")
        .send({
            type: "SUCCESS",
            message: successMessage
        });
}));

router.use(returnHasJSONIfNeeded);
router.use(errorsWithPossibleRedirect("Oups, something went wrong", "/admin"));

module.exports = router;
