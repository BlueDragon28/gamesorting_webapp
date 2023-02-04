const bigint = require("../numbers/bigint");

function checkIfUserValid(user) {
    return  user && bigint.isValid(user.id) && 
            typeof user.username === "string" && user.username.length &&
            typeof user.email === "string" && user.email.length;
}

module.exports = {
    checkIfUserValid
}
