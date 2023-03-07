/*
Creating a connection to mariadb and add helpers
functions to make queries.
*/

const mariadb = require("mariadb");
const { SqlError } = require("../utils/errors/exceptions");

let pool = undefined;

async function openPool(suffix = "") {
    pool = mariadb.createPool({
        user: "bluedragon28",
        socketPath: "/var/run/mysql/mysql.sock",
        database: "gamesorting_webapp" + suffix,
        connectionLimit: 1,
        multipleStatements: true
    });
}

module.exports = {
    getConnection: async function(func) {
        if (!func) {
            throw new Error("Invalid Function");
        }

        let connection;
        try {
            connection = await pool.getConnection();
        } catch (error) {
            throw new SqlError(`Cannot get a connection to mariadb: ${error.message}`);
        }

        if (!connection) {
            throw new SqlError("Invalid Connection");
        }

        try {
            const result = await func(connection);
            connection.close();
            return result;
        } finally {
            connection.close();
        }
    },

    openPool,

    closePool: async function() {
        return pool.end().catch(err => undefined);
    }
};
