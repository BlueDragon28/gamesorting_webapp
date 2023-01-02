const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError } = require("../utils/errors/exceptions");

function strRetrieveItemsFromList(collectionID, listID, itemID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);

    if (itemID) {
        itemID = bigint.toBigInt(itemID);
    }

    if (!bigint.isValid(collectionID) || !bigint.isValid(listID) || (itemID && !bigint.isValid(itemID))) {
        throw new ValueError(400, "Invalid Collection ID or List ID or Item ID");
    }

    let strStatement = 
        "SELECT ItemID, i.Name AS Name, URL FROM items i " + 
        "INNER JOIN lists l ON i.ListID = l.ListID " + 
        "INNER JOIN collections c ON l.CollectionID = c.CollectionID " +
        `WHERE i.ListID = ${listID.toString()} AND c.CollectionID = ${collectionID}`;
    
    if (itemID) {
        strStatement += ` AND i.ItemID = ${itemID}`;
    }

    return strStatement;
}

function strAddNewItem(collectionID, listID, itemData) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(collectionID) || !bigint.isValid(listID) || 
        typeof itemData !== "object" || !itemData.name || itemData.name.trim().length === 0) {
        throw new ValueError(400, "Invalid Collection ID or List ID or Item Name");
    }

    return `INSERT INTO items(ListID, Name ${itemData.url ? ", Url":""}) ` +
           `VALUES (${listID}, "${itemData.name}" ${itemData.url ? ", \"" + itemData.url + "\"":""})`;
}

function strDeleteItem(collectionID, listID, itemID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);
    itemID = bigint.toBigInt(itemID);

    if (!bigint.isValid(collectionID) || !bigint.isValid(listID) || !bigint.isValid(itemID)) {
        throw new ValueError(400, "Invalid Collection ID or List ID or Item ID");
    }

    return "DELETE FROM items " +
           `WHERE items.ItemID = ${itemID} AND items.ListID = ${listID}`;
}

function strCheckIfItemExists(collectionID, listID, itemID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);
    itemID = bigint.toBigInt(itemID);

    if (!collectionID || !listID || !itemID) {
        throw new ValueError(400, "Invalid Collection ID or List ID or Item ID");
    }

    return "SELECT COUNT(i.ItemID) AS count FROM items i " +
           "INNER JOIN lists l ON i.ListID = i.ListID " +
           "INNER JOIN collections c ON l.CollectionID = c.CollectionID " +
           `WHERE i.ItemID = ${itemID} AND l.ListID = ${listID.toString()} AND c.CollectionID = ${collectionID}`;
}

/*
Checking if an item exists and is part of a specific list and collection.
*/
const checkIfItemExists = async (connection, collectionID, listID, itemID) => {
    const strStatement = strCheckIfItemExists(collectionID, listID, itemID);

    if (!connection || !strStatement) {
        throw new SqlError("Failed to prepare statement");
    }

    try {
        const queryResult = await connection.query(strStatement);

        if (queryResult[0].count > 0) {
            return true;
        }
    } catch (error) {
        throw new SqlError(`Failed to check if item ${itemID} already exists: ${error.message}`);
    }

    return false;
}

module.exports = {
    exists: checkIfItemExists,

    /*
    Return the items inside a list
    */
    find: async (connection, collectionID, listID, itemID) => {
        const strStatement = strRetrieveItemsFromList(collectionID, listID, itemID);

        if (!connection || !strStatement) {
            throw new SqlError("Failed to prepare statement");
        }

        let queryResult = null;
        try {
            queryResult = await connection.query(strStatement);

            if (itemID) {
                queryResult = queryResult[0];
            }
        } catch (error) {
            throw new SqlError(`Failed to find item ${itemID}: ${error.message}`);
        }

        return queryResult;
    },

    /*
    Insert a new item into a list
    */
    new: async (connection, itemData) => {
        const strStatement = strAddNewItem(
            itemData.parent.collection.CollectionID, 
            itemData.parent.list.ListID, 
            itemData.data);

        if (!connection || !strStatement) {
            throw new SqlError("Failed to prepare statement");
        }

        try {
            queryResult = await connection.query(strStatement);
        } catch (error) {
            throw new SqlError(`Failed to insert a new item ${error.message}`);
        }

        return true;
    },

    /*
    Delete an item from a list
    */
    delete: async (connection, collectionID, listID, itemID) => {
        const strStatement = strDeleteItem(collectionID, listID, itemID);

        if (!connection || !strStatement) {
            throw new SqlError("Failed to prepare statement");
        }

        try {
            await connection.query(strStatement);
        } catch (error) {
            throw new SqlError(`Failed to delete the item ${itemID}: ${error.message}`);
        }

        return true;
    }
};