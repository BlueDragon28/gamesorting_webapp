/*
All the SQL interaction with the gamesorting_webapp SQL databases are made here.
*/
const mariadb = require("../sql/connection");
const collections = require("./collections");

const Tables = {
    COLLECTIONS: "collections"
};

/*
Retrieving all the data of a specific table.
*/
async function retrieveAllData(connection, table) {
    if (!connection) {
        return null;
    }

    switch (table) {

    case Tables.COLLECTIONS:
        return await collections.find(connection);

    }
}

module.exports = {
    // The enum of the SQL tables available.
    ...Tables,

    /*
    Retrieve data from a specific table
    */
    find: async (table) => {
        if (!table || typeof table !== "string" || table.length === 0) {
            return null;
        }

        const connection = await mariadb.getConnection();
        if (!connection) {
            return null;
        }

        return retrieveAllData(connection, table);
    }
};