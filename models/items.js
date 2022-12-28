const bigint = require("../common/numbers/bigint");

function strRetrieveItemsFromList(collectionID, listID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(collectionID) || !bigint.isValid(listID)) {
        return null;
    }

    return "SELECT ItemID, i.Name AS Name, URL FROM items i " + 
           "INNER JOIN lists l ON i.ListID = l.ListID " + 
           "INNER JOIN collections c ON l.CollectionID = c.CollectionID " +
           `WHERE i.ListID = ${listID.toString()} AND c.CollectionID = ${collectionID}`;
}

module.exports = {
    /*
    Return the items inside a list
    */
    find: async (connection, collectionID, listID) => {
        const strStatement = strRetrieveItemsFromList(collectionID, listID);

        if (!connection || !strStatement) {
            return null;
        }

        let queryResult = null;
        try {
            queryResult = await connection.query(strStatement);
        } catch (error) {
            console.error(`Failed to retrieve items from list ${listID}\n\t${error}`);
        }

        return queryResult;
    }
};