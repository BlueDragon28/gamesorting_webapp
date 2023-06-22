const deleteLostPasswordToken = require("./deleteLostPasswordToken");
const deleteExpiredActivity = require("./deleteUserActivies");
const { enableTask: activitiesHandling } = require("./activitiesHandling");

const activatedTask= [];

function activate() {
    activatedTask.push(deleteLostPasswordToken());
    activatedTask.push(deleteExpiredActivity())
    activatedTask.push(activitiesHandling());
}

async function deactivate() {
    for (const task of activatedTask) {
        await task.deactivate();
    }
}

module.exports =  {
    activate,
    deactivate
};
