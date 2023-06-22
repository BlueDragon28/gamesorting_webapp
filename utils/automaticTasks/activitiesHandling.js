const { UserActivity } = require("../../models/userActivity");
const { existingOrNewConnection } = require("../sql/sql");

/*
Saving user activies in memory before saving it into the db
*/

const userActivities = [];

function registerActivityMiddleware(req, res, next) {
    const currentUserID = req.session.user ? req.session.user.id : undefined;
    const currentActivity = {
        userID: currentUserID,
        type: undefined,
        time: Date.now()
    };
    userActivities.push(currentActivity);

    next();
}

async function saveActivities() {
    const acitivitiesModels = userActivities.map(item => (
        new UserActivity(item.userID, item.type, item.time)
    ));
    userActivities.splice(0);

    await existingOrNewConnection(null, async function(connection) {
        for (const activity of acitivitiesModels) {
            await activity.save(connection);
        }
    });
}

function enableTask() {
    const interval = process.env.NODE_ENV === "production" ?
        1000 * 60 * 15 : // 15 minutes
        1000 * 60; // 1 minutes

    const intervalID = setInterval(saveActivities, interval);

    return {
        deactivate: async () => {
            clearInterval(intervalID);
            await saveActivities();
        }
    };
}

module.exports = {
    enableTask,
    registerActivityMiddleware
};
