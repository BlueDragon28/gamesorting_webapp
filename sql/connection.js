/*
Creating a connection to mariadb and add helpers
functions to make queries.
*/

const mariadb = require("mariadb");
const { SqlError } = require("../utils/errors/exceptions");

let pool = undefined;

let databaseName = process.env.MARIADB_DATABASE_NAME;

async function openPool(suffix = "") {
    pool = mariadb.createPool({
        user: process.env.MARIADB_USER,
        socketPath: process.env.MARIADB_SOCKET_PATH,
        database: process.env.NODE_ENV === "production" ? databaseName : databaseName + suffix,
        connectionLimit: process.env.MARIADB_CONNECTION_LIMIT,
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
