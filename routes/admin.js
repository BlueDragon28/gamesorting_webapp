const express = require("express");
const { User } = require("../models/users");
const { UserActivity } = require("../models/userActivity");
const { isLoggedIn } = require("../utils/users/authentification");
const wrapAsync = require("../utils/errors/wrapAsync");

const router = express.Router();

async function isUserAdmin(req, res, next) {
    const isUserAdmin = await User.isAdmin(req.session.user.id);

    if (!isUserAdmin) {
        req.flash("error", "You cannot access this section");
        return res.redirect("/");
    }

    next();
}

function divideActiviesByDays(activities) {
    if (!Array.isArray(activities)) {
        return {
            days: [],
            maxADay: 0
        }
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

router.use(isLoggedIn);
router.use(wrapAsync(isUserAdmin));

router.get("/", function(req, res) {
    res.render("admin/index");
});

router.get("/activities", wrapAsync(async function(req, res) {
    const userActivitesInLast30Days = 
        await UserActivity.findByTimelapsFromNow(30 * 24); // last 30 days
    
    const parsedDateValue = divideActiviesByDays(userActivitesInLast30Days);

    res.render("admin/activities", { userActivity: parsedDateValue });
}));

module.exports = router;