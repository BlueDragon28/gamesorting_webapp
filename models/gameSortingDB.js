/*
All the SQL interaction with the gamesorting_webapp SQL databases are made here.
*/
const mariadb = require("../sql/connection");
const collections = require("./collections");
const lists = require("./lists");

const Tables = {
    COLLECTIONS: "collections",
    LISTS: "lists"
};

/*
Retrieving all the data of a specific table.
*/
async function retrieveAllData(connection, table, args) {
    if (!connection) {
        return null;
    }

    switch (table) {

    case Tables.COLLECTIONS:
        return await collections.find(connection);

    case Tables.LISTS:
        return await lists.find(connection, ...args);
    }
}

module.exports = {
    // The enum of the SQL tables available.
    ...Tables,

    /*
    Retrieve data from a specific table
    */
    find: async (table, ...args) => {
        if (!table || typeof table !== "string" || table.length === 0) {
            return null;
        }

        const connection = await mariadb.getConnection();
        if (!connection) {
            return null;
        }

        const queryData = await retrieveAllData(connection, table, args);
        connection.close();
        return queryData;
    }
};