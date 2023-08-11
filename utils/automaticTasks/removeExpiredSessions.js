const { Session } = require("../../models/session");

function enableTask() {
    const interval = process.env.NODE_ENV === "production" ?
        1000 * 60 * 60 * 24 : // Every 24 hours
        1000 * 60 * 5; // Every 5 minutes

    const intervalID = setInterval(async function() {
        await Session.removeExpiredSessions();
    }, interval);

    return {
        deactivate: () => {
            clearInterval(intervalID);
        }
    }
}

module.exports = enableTask;
