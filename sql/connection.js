/*
Creating a connection to mariadb and add helpers
functions to make queries.
*/

const mariadb = require("mariadb");
const { SqlError } = require("../utils/errors/exceptions");
const { getEnvValueFromFile, isFileBased } = require("../utils/loadingEnvVariable");

let pool = undefined;

const dbConnectionInfo = {
    user: undefined,
    host: undefined,
    port: undefined,
    socketPath: undefined,
    database: undefined,
    connectionLimit: 1,
    multipleStatements: true
};

if (typeof process.env.MARIADB_USER !== "string" && !process.env.MARIADB_USER.length) {
    throw new Error("Database user username must be provided with the MARIADB_USER env variable!");
}
dbConnectionInfo.user = isFileBased(process.env.MARIADB_USER) ?
    getEnvValueFromFile(process.env.MARIADB_USER) : process.env.MARIADB_USER;

if (typeof process.env.MARIADB_HOST_PORT === "string" && process.env.MARIADB_HOST_PORT.length) {
    const [host,port] = 
        (isFileBased(process.env.MARIADB_HOST_PORT) ? 
            getEnvValueFromFile(process.env.MARIADB_HOST_PORT) : 
            process.env.MARIADB_HOST_PORT)
        .split(":").map((item, index) => index === 1 ? Number.parseInt(item) : item);
    
    dbConnectionInfo.host = host;
    dbConnectionInfo.port = port;
} else if (typeof process.env.MARIADB_SOCKET_PATH === "string" && process.env.MARIADB_SOCKET_PATH.length) {
    dbConnectionInfo.socketPath = process.env.MARIADB_SOCKET_PATH;
} else {
    throw new Error("You must provide MariaDB user and host or socket path connection info!");
}

if (typeof process.env.MARIADB_DATABASE_NAME === "string" && process.env.MARIADB_DATABASE_NAME.length) {
    dbConnectionInfo.database = process.env.MARIADB_DATABASE_NAME;
} else {
    throw new Error("You must provide database name!");
}

if (typeof process.env.MARIADB_CONNECTION_LIMIT === "string" && process.env.MARIADB_CONNECTION_LIMIT.length) {
    dbConnectionInfo.connectionLimit = process.env.MARIADB_CONNECTION_LIMIT;
}

function openPool(suffix = "") {
    pool = mariadb.createPool(dbConnectionInfo);
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
    },

    getPool: () => pool
};
