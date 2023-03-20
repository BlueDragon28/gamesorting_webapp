const { UserLostPassword } = require("../../models/usersLostPassword");

function enableTask() {
    const interval = process.env.NODE_ENV === "production" ?
        1000 * 60 * 60 * 24 : // Execution every day
        1000 * 60 * 5; // Exerution every 5 minutes

    const intervalID = setInterval(async function() {
        await UserLostPassword.deleteExpiredToken();
    }, interval);

    return {
        deactivate: () => {
            clearInterval(intervalID);
        }
    };
}

module.exports = enableTask;
