const deleteLostPasswordToken = require("./deleteLostPasswordToken");
const deleteExpiredActivity = require("./deleteUserActivies");

const activatedTask= [];

function activate() {
    activatedTask.push(deleteLostPasswordToken());
    activatedTask.push(deleteExpiredActivity())
}

function deactivate() {
    for (const task of activatedTask) {
        task.deactivate();
    }
}

module.exports =  {
    activate,
    deactivate
};
