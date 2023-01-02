/*
All the SQL interaction with the gamesorting_webapp SQL databases are made here
*/
const mariadb = require("../sql/connection");
const collections = require("./collections");
const lists = require("./lists");
const items = require("./items");
const bigint = require("../utils/numbers/bigint");

const Tables = {
    COLLECTIONS: "collections",
    LISTS: "lists",
    ITEMS: "items"
};

/*
Parse the collections data before returning it
 - data: the collection data to parse
 - unique: there should be only one item there
*/
function parseCollectionsData(data, unique = false) {
    delete data.meta;
    return {
        data: unique === true && data.length > 0 ? data[0] : data
    };
}

/*
Parse the lists data before returning it
*/
function parseListData(collectionData, listsData) {
    delete collectionData.meta;
    delete listsData.meta;

    return {
        parent: {
            collection: collectionData[0]
        },
        data: listsData
    };
}

/*
Parse the items data before returning it
*/
function parseItemsData(collectionData, listData, itemsData) {
    delete collectionData.meta;
    delete listData.meta;
    delete itemsData.meta;

    return {
        parent: {
            collection: collectionData[0],
            list: listData[0]
        },
        data: itemsData
    };
}

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

    case Tables.ITEMS: {
        return await items.exists(connection, ...args);
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
        const queryCollections = await collections.find(connection, ...args);
        return parseCollectionsData(queryCollections, args.length > 0);
    }

    case Tables.LISTS: {
        const collection = await collections.findNameAndID(connection, ...args);
        const returnLists = await lists.find(connection, ...args);

        if (!collection || !returnLists) {
            return null;
        }

        return parseListData(collection, returnLists);
    }

    case Tables.ITEMS: {
        const collection = await collections.findNameAndID(connection, args[0]);
        const list = await lists.findNameAndID(connection, args[1]);
        const returnItems = await items.find(connection, ...args);

        if (!list || !returnItems) {
            return null;
        }

        return parseItemsData(collection, list, returnItems);
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

    case Tables.ITEMS: {
        if (!await checkIfExists(connection, Tables.COLLECTIONS, [ params.collectionID ])) {
            return false;
        }

        if (!await checkIfExists(connection, Tables.LISTS, [ params.collectionID, params.listID ])) {
            return false;
        }

        return await items.new(connection, params.collectionID, params.listID, params.item);
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
        return await collections.delete(connection, params);
    }

    case Tables.LISTS: {
        if (!await checkIfExists(connection, Tables.COLLECTIONS, [ params.collectionID ]) ||
            !await checkIfExists(connection, Tables.LISTS, [ params.collectionID, params.listID ])) {
            return false;
        }

        return await lists.delete(connection, params.collectionID, params.listID);
    }

    case Tables.ITEMS: {
        if (!await checkIfExists(connection, Tables.COLLECTIONS, [ params.collectionID ]) ||
            !await checkIfExists(connection, Tables.LISTS, [ params.collectionID, params.listID ]) ||
            !await checkIfExists(connection, Tables.ITEMS, [ params.collectionID, params.listID, params.itemID ])) {
            return false;
        }

        return await items.delete(connection, params.collectionID, params.listID, params.itemID);
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

        const result = await deleteData(connection, table, params);

        connection.close();
        return result;
    }
};