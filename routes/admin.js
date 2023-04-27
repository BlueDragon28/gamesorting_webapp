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

function separeActiviesByDays(activities) {
    if (Array.isArray(activities)) {
        return []
    }

    const now = Date.now();
    const parsedDate = [];
    const aDayInMilliseconds = 24 * 60 * 60 * 1000;

    for (let i = 0; i < 30; i++) {
        const endTime = now - (aDayInMilliseconds * i);
        const startTime = now - (aDayInMilliseconds * (i+1));
        const day = {
            day: i,
            activities: 0
        };

        for (const activity of activities) {
            if (activity.time >= startTime && activity.time <= startTime) {
                day.activities++;
            }
        }

        parsedDate.push(day);
    }

    return parsedDate;
}

router.use(isLoggedIn);
router.use(wrapAsync(isUserAdmin));

router.get("/activities", wrapAsync(async function(req, res) {
    const userActivitesInLast32Days = 
        await UserActivity.findByTimelapsFromNow(30 * 24); // last 30 days
    
    const parsedDateValue = separeActiviesByDays(userActivitesInLast32Days);

    res.render("admin/activities", { userActivity: parsedDateValue });
}));

module.exports = router;