const mariadb = require("../../sql/connection");

function sqlString(str) {
    return str.replaceAll('"', '""').replaceAll("\\", "\\\\");
}

async function existingOrNewConnection(connection, callback, ...args) {
    if (connection) {
        return await callback(connection, ...args);
    }

    return await mariadb.getConnection(async function (conn) {
        return await callback(conn, ...args);
    });
}

module.exports = {
    sqlString,
    existingOrNewConnection
}
