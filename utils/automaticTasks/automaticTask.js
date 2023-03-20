const deleteLostPasswordToken = require("./deleteLostPasswordToken");

const activatedTask= [];

function activate() {
    activatedTask.push(deleteLostPasswordToken());
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
