const { UserActivity } = require("../../models/userActivity");
const wrapAsync = require("../errors/wrapAsync");

// Middleware registering every user interaction
module.exports = wrapAsync(async function(req, res, next) {
    const currentUserID = req.session.user ? req.session.user.id : undefined;

    const userActivity = new UserActivity(currentUserID, undefined);
    await userActivity.save();
    next();
});