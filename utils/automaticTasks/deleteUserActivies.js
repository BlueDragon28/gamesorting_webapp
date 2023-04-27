const { UserActivity } = require("../../models/userActivity");

function enableTask() {
    const interval = process.env.NODE_ENV === "production" ?
        1000 * 60 * 60 * 24 :
        1000 * 60 * 5;
    
    const intervalID = setInterval(async function() {
        await UserActivity.deleteAllAfterTimelaps(UserActivity.expirationHours);
    }, interval);

    return {
        deactivate: () => {
            clearInterval(intervalID);
        }
    };
}

module.exports = enableTask;