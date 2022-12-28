/*
All the SQL interaction with the gamesorting_webapp SQL databases are made here
*/
const mariadb = require("../sql/connection");
const collections = require("./collections");
const lists = require("./lists");

const Tables = {
    COLLECTIONS: "collections",
    LISTS: "lists"
};

/*
Retrieving all the data of a specific table
*/
async function retrieveAllData(connection, table, args) {
    if (!connection) {
        return null;
    }

    switch (table) {

    case Tables.COLLECTIONS:
        return await collections.find(connection);

    case Tables.LISTS:
        const collection = await collections.findNameAndID(connection, ...args);
        const returnLists = await lists.find(connection, ...args);

        if (!collection || !returnLists) {
            return null;
        }

        return { collection: collection[0], data: returnLists };
    }
}

async function addData(connection, table, params) {
    if (!connection) {
        return null;
    }

    switch (table) {

    case Tables.COLLECTIONS:
        return await collections.new(connection, params.name);

    }
}

/*
Deleting an item from a table
*/
async function deleteData(connection, table, params) {
    if (!connection) {
        return null;
    }

    switch (table) {

    case Tables.COLLECTIONS:
        return await collections.delete(connection, params.id);

    }
}

module.exports = {
    // The enum of the SQL tables available
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
    },

    /*
    Add data to a specific table
    */
    new: async (table, params) => {
        if ((!table && typeof table !== "string" && table.length === 0) ||
                (!params && typeof params !== "object")) {
            return null;
        }

        const connection = await mariadb.getConnection();
        if (!connection) {
            return null;
        }

        const result = await addData(connection, table, { name: params });

        connection.close();
        return result;
    },

    /*
    Deleting an item from a table
    */
    delete: async (table, params) => {
        if ((!table && typeof table !== "string" && table.length === 0) ||
                (!params && typeof params !== "number" && typeof params !== "bigint" && typeof params !== "string")) {
            return null;
        }

        const connection = await mariadb.getConnection();

        if (!connection) {
            return null;
        }

        const result = await deleteData(connection, table, { id: params });

        connection.close();
        return result;
    }
};