const bigint = require("../common/numbers/bigint");

function strRetrieveItemsFromList(collectionID, listID, itemID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);

    if (itemID) {
        itemID = bigint.toBigInt(itemID);
    }

    if (!bigint.isValid(collectionID) || !bigint.isValid(listID) || (itemID && !bigint.isValid(itemID))) {
        return null;
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

function strCheckIfItemExists(collectionID, listID, itemID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);
    itemID = bigint.toBigInt(itemID);

    if (!collectionID || !listID || !itemID) {
        return null;
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
        return false;
    }

    try {
        const queryResult = await connection.query(strStatement);

        if (queryResult[0].count > 0) {
            return true;
        }
    } catch (error) {
        console.log(`Failed to check if item exists\n\t${error}`);
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
            return null;
        }

        let queryResult = null;
        try {
            queryResult = await connection.query(strStatement);

            if (itemID) {
                queryResult = queryResult[0];
            }
        } catch (error) {
            console.error(`Failed to retrieve items from list ${listID}\n\t${error}`);
        }

        return queryResult;
    }
};