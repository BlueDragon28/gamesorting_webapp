/*
Creating a connection to mariadb and add helpers
functions to make queries.
*/

const mariadb = require("mariadb");
const { SqlError } = require("../utils/errors/exceptions");

const pool = mariadb.createPool({
    user: "bluedragon28",
    socketPath: "/var/run/mysql/mysql.sock",
    database: "gamesorting_webapp",
    connectionLimit: 1
})

module.exports = {
    getConnection: async () => {
        try {
            const connection = await pool.getConnection();
            return connection;
        } catch (error) {
            throw new SqlError(`Cannot get a connection to mariadb: ${error.message}`);
        }
    }
};