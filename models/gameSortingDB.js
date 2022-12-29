/*
All the SQL interaction with the gamesorting_webapp SQL databases are made here
*/
const mariadb = require("../sql/connection");
const collections = require("./collections");
const lists = require("./lists");
const items = require("./items");
const bigint = require("../common/numbers/bigint");

const Tables = {
    COLLECTIONS: "collections",
    LISTS: "lists",
    ITEMS: "items"
};

/*
Check if an item exists
*/
async function checkIfExists(connection, table, args) {
    if (!connection) {
        return null;
    }

    switch (table) {

    case Tables.COLLECTIONS: {
        return await collections.exists(connection, ...args);
    }

    case Tables.LISTS: {
        return await lists.exists(connection, ...args);
    }

    }
}

/*
Retrieving all the data of a specific table
*/
async function retrieveAllData(connection, table, args) {
    if (!connection) {
        return null;
    }

    switch (table) {

    case Tables.COLLECTIONS: {
        return await collections.find(connection, ...args);
    }

    case Tables.LISTS: {
        const collection = await collections.findNameAndID(connection, ...args);
        const returnLists = await lists.find(connection, ...args);

        if (!collection || !returnLists) {
            return null;
        }

        return { collection: collection[0], data: returnLists };
    }

    case Tables.ITEMS: {
        const collection = await collections.findNameAndID(connection, ...args);
        const list = await lists.findNameAndID(connection, ...args);
        const returnItems = await items.find(connection, ...args);

        if (!list || !returnItems) {
            return null;
        }

        return { collection: collection[0], list: list[0], data: returnItems }
    }

    }
}

async function addData(connection, table, params) {
    if (!connection) {
        return null;
    }

    switch (table) {

    case Tables.COLLECTIONS: {
        return await collections.new(connection, params.name);
    }

    case Tables.LISTS: {
        if (!await checkIfExists(connection, Tables.COLLECTIONS, params.collectionID)) {
            return false;
        }

        return await lists.new(connection, params.collectionID, params.name);
    }

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

    case Tables.COLLECTIONS: {
        return await collections.delete(connection, params.id);
    }

    }
}

module.exports = {
    // The enum of the SQL tables available
    ...Tables,

    /*
    Check if an item exists
    */
    exists: async (table, ...args) => {
        if (!table || typeof table !== "string" || table.length === 0) {
            return null;
        }

        const connection = await mariadb.getConnection();
        if (!connection) {
            return null;
        }

        const queryData = await checkIfExists(connection, table, args);
        connection.close();
        return queryData;
    },

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

        const result = await addData(connection, table, params);

        connection.close();
        return result;
    },

    /*
    Deleting an item from a table
    */
    delete: async (table, params) => {
        if ((!table && typeof table !== "string" && table.length === 0) ||
                !bigint.isValid(params)) {
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