const deleteLostPasswordToken = require("./deleteLostPasswordToken");
const deleteExpiredActivity = require("./deleteUserActivies");
const { enableTask: activitiesHandling } = require("./activitiesHandling");
const removeExpiredSessions = require("./removeExpiredSessions");

const activatedTask = [];

function activate() {
  activatedTask.push(deleteLostPasswordToken());
  activatedTask.push(deleteExpiredActivity());
  activatedTask.push(activitiesHandling());
  activatedTask.push(removeExpiredSessions());
}

async function deactivate() {
  for (const task of activatedTask) {
    await task.deactivate();
  }
}

module.exports = {
  activate,
  deactivate,
};
