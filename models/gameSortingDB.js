/*
All the SQL interaction with the gamesorting_webapp SQL databases are made here
*/
const mariadb = require("../sql/connection");
const collections = require("./collections");
const lists = require("./lists");
const items = require("./items");
const customUserData = require("./customUserData");
const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError, InternalError } = require("../utils/errors/exceptions");

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
function parseListData(collectionData, listsData, customColumns) {
    delete collectionData.meta;
    delete listsData.meta;
    if (customColumns) {
        delete customColumns.meta;
    }

    const parsedList = {
        parent: {
            collection: collectionData[0]
        },
        data: listsData,
    };

    if (customColumns) {
        parsedList.customColumns = customColumns;
    }

    return parsedList;
}

/*
Parse the items data before returning it
*/
function parseItemsData(collectionData, listData, itemsData, customColumns) {
    delete collectionData.meta;
    delete listData.meta;
    delete itemsData.meta;
    delete customColumns.meta;

    return {
        parent: {
            collection: collectionData[0],
            list: listData[0]
        },
        data: itemsData,
        customColumns
    };
}

async function queryCustomDataPerItems(connection, customColumnsType, itemData) {
    if (!connection || !customColumnsType || !itemData) {
        throw new InternalError("Invalid Data");
    }

    let customData = [];

    for (let customColumn of customColumnsType) {
        const returnData = await customUserData.getCustomData(connection, customColumn.ListColumnTypeID, itemData.ItemID);

        if (returnData) {
            delete returnData.meta;
            customData.push(returnData);
        }
    }

    return customData;
}

async function retrieveCustomItemsData(connection, customColumnsType, itemsData) {
    if (!connection || !customColumnsType || !itemsData) {
        throw new InternalError("Invalid Data");
    }

    if (Array.isArray(itemsData)) {
        for (let item of itemsData) {
            item.customData = await queryCustomDataPerItems(connection, customColumnsType, item);
        }
    } else {
        itemsData.customData = await queryCustomDataPerItems(connection, customColumnsType, itemsData);
    }

    return itemsData;
}

/*
Check if an item exists
*/
async function checkIfExists(connection, table, args) {
    if (!connection) {
        throw new SqlError("Invalid Connection");
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
        throw new SqlError("Invalid Connection");
    }

    switch (table) {

    case Tables.COLLECTIONS: {
        const queryCollections = await collections.find(connection, ...args);
        return parseCollectionsData(queryCollections, args.length > 0);
    }

    case Tables.LISTS: {
        const collectionID = args[0], listID = args[1];

        const collection = await collections.findNameAndID(connection, collectionID);
        const returnLists = await lists.find(connection, collectionID, listID);
        
        let customColumns;
        if (listID) {
            customColumns = await customUserData.getListColumnsType(connection, listID);
        }

        if (!collection || !collection.length) {
            throw new ValueError(400, `Collection ${collectionID} is not a valid collection`);
        }

        if (!returnLists || (listID && !returnLists.ListID)) {
            throw new InternalError("Failed To Query Lists");
        }

        if (listID && !customColumns) {
            throw new InternalError("Failed To Query Custom Columns");
        }

        return parseListData(collection, returnLists, customColumns);
    }

    case Tables.ITEMS: {
        const collectionID = args[0], listID = args[1], itemID = args[2];

        const collection = await collections.findNameAndID(connection, collectionID);
        const list = await lists.findNameAndID(connection, collectionID, listID);
        const returnItems = await items.find(connection, collectionID, listID, itemID);
        const customColumnsType = await customUserData.getListColumnsType(connection, listID);
        const parsedItems = await retrieveCustomItemsData(connection, customColumnsType, returnItems);

        if (!collection || !collection.length || !list || !list.length) {
            throw new ValueError(400, "Invalid collection or list");
        }

        if (!returnItems || (itemID && !returnItems.ItemID)) {
            throw new InternalError("Failed To Query Items");
        }

        if (!customColumnsType) {
            throw new InternalError("Failed To Query Custom Columns");
        }

        return parseItemsData(collection, list, parsedItems, customColumnsType);
    }

    }
}

async function addData(connection, table, params) {
    if (!connection) {
        throw new SqlError("Invalid Connection");
    }

    switch (table) {

    case Tables.COLLECTIONS: {
        return await collections.new(connection, params.data);
    }

    case Tables.LISTS: {
        if (!await checkIfExists(connection, Tables.COLLECTIONS, [ params.parent.collection.CollectionID ])) {
            throw new ValueError(400, "Invalid Collection");
        }

        return await lists.new(connection, params);
    }

    case Tables.ITEMS: {
        const collectionID = params.parent.collection.CollectionID;
        const listID = params.parent.list.ListID;

        if (!await checkIfExists(connection, Tables.LISTS, [ collectionID, listID ])) {
            throw new ValueError(400, "Invalid Collection Or List");
        }

        return await items.new(connection, params) > 0;
    }

    }
}

/*
Edit an item from a table
*/
async function editData(connection, table, params) {
    if (!connection) {
        throw new SqlError("Invalid Connection");
    }

    switch (table) {
    
    case Tables.COLLECTIONS: {
        const collectionData = params;

        if (!await checkIfExists(connection, Tables.COLLECTIONS, [ collectionData.data.CollectionID ])) {
            throw new ValueError(400, "Invalid Collection");
        }

        return await collections.edit(connection, collectionData);
    }

    case Tables.LISTS: {
        const listData = params;

        if (!await checkIfExists(connection, Tables.LISTS, [ listData.parent.collection.CollectionID, listData.data.ListID ])) {
            throw new ValueError(400, "Invalid Collection Or List");
        }

        return await lists.edit(connection, listData);
    }

    case Tables.ITEMS: {
        const itemData = params;

        if (!await checkIfExists(connection, Tables.ITEMS, [ itemData.parent.collection.CollectionID, itemData.parent.list.ListID, itemData.data.ItemID ])) {
            throw new ValueError(400, "Invalid Collection Or List Or Item");
        }

        const result = await items.edit(connection, itemData);
        return result;
    }

    }
}

/*
Deleting an item from a table
*/
async function deleteData(connection, table, params) {
    if (!connection) {
        throw new SqlError("Invalid Connection");
    }

    switch (table) {

    case Tables.COLLECTIONS: {
        const collectionID = params;
        return await collections.delete(connection, collectionID);
    }

    case Tables.LISTS: {
        const { collectionID, listID } = params;

        if (!await checkIfExists(connection, Tables.LISTS, [ collectionID, listID ])) {
            throw new ValueError(400, "Invalid Collection Or List");
        }

        return await lists.delete(connection, collectionID, listID);
    }

    case Tables.ITEMS: {
        const { collectionID, listID, itemID } = params;

        if (!await checkIfExists(connection, Tables.ITEMS, [ collectionID, listID, itemID ])) {
            throw new ValueError(400, "Invalid Collection Or List Or Item");
        }

        return await items.delete(connection, collectionID, listID, itemID);
    }

    }
}

module.exports = {
    // The enum of the SQL tables available
    ...Tables,

    /*
    Check if an item exists
    */
    exists: async function(table, ...args) {
        if (!table || typeof table !== "string" || table.trim().length === 0) {
            throw new InternalError(`${table} is not a valid table`);
        }

        return await mariadb.getConnection(async function(connection) {
            return await checkIfExists(connection, table, args);
        });
    },

    /*
    Retrieve data from a specific table
    */
    find: async function(table, ...args) {
        if (!table || typeof table !== "string" || table.length === 0) {
            throw new InternalError(`${table} is not a valid table`);
        }

        return await mariadb.getConnection(async function(connection) {
            return await retrieveAllData(connection, table, args);
        });
    },

    /*
    Add data to a specific table
    */
    new: async function(table, params) {
        if ((!table || typeof table !== "string" || table.length === 0)) {
            throw new InternalError(`${table} is not a valid table`);
        }

        return await mariadb.getConnection(async function(connection) {
            return await addData(connection, table, params);
        });
    },

    /*
    Edit an item from a table
    */
    edit: async function(table, params) {
        if ((!table || typeof table !== "string" || table.length === 0)) {
            throw new InternalError(`${table} is not a valid table`);
        }

        return await mariadb.getConnection(async function(connection) {
            return await editData(connection, table, params);
        });
    },

    /*
    Deleting an item from a table
    */
    delete: async function(table, params) {
        if ((!table || typeof table !== "string" || table.length === 0)) {
            throw new InternalError(`${table} is not a valid table`);
        }

        return await mariadb.getConnection(async function(connection) {
            return await deleteData(connection, table, params);
        });
    }
};