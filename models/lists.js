const bigint = require("../common/numbers/bigint");

/*
Statement to query the lists available in a collection
*/
function strRetrieveListsFromCollection(collectionID) {
    collectionID = bigint.toBigInt(collectionID);

    if (!bigint.isValid(collectionID)) {
        return null;
    }

    return `SELECT ListID, Name FROM lists WHERE CollectionID = ${collectionID.toString()}`;
}

function strRetrieveNameAndIDFromListID(listID) {
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(listID)) {
        return null;
    }

    return `SELECT ListID, Name FROM lists WHERE ListID = ${listID.toString()}`;
}

function strCheckIfListExists(collectionID, listID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(collectionID) || !bigint.isValid(listID)) {
        return null;
    }

    return "SELECT COUNT(ListID) AS count FROM lists " +
           "INNER JOIN collections USING (CollectionID) " +
           `WHERE ListID = ${listID} AND collections.CollectionID = ${collectionID}`;
}

function strAddNewList(collectionID, listName) {
    collectionID = bigint.toBigInt(collectionID);

    if (!bigint.isValid(collectionID) || (typeof listName !== "string" || listName.length === 0)) {
        return null;
    }

    return "INSERT INTO lists(CollectionID, Name) " +
           `VALUES (${collectionID}, "${listName}")`;
}

module.exports = {
    /*
    Check if a list exist and is part of a collection.
    */
    exists: async (connection, collectionID, listID) => {
        const strStatement = strCheckIfListExists(collectionID, listID);

        if (!connection || !strStatement) {
            return false;
        }

        try {
            const queryResult = await connection.query(strStatement);
            if (queryResult[0].count > 0) {
                return true;
            }
        } catch (error) {
            console.error(`Failed to find if list ${listID} exists and is part of collection ${collectionID}\n\t${error}`);
        }

        return false;
    },

    /*
    Returning the lists available inside a collection
    */
    find: async (connection, collectionID) => {
        const strStatement = strRetrieveListsFromCollection(collectionID);

        if (!connection || !strStatement) {
            return null;
        }

        let queryResult = null;
        try {
            queryResult = await connection.query(strStatement);
        } catch (error) {
            console.error(`Failed to query data from lists SQL table\n\t${error}`)
        }

        return queryResult;
    },

    /*
    Return the name and id of a list from a ListID
    */
    findNameAndID: async (connection, listID) => {
        const strStatement = strRetrieveNameAndIDFromListID(listID);

        if (!connection || !strStatement) {
            return null;
        }

        let queryResult = null;
        try {
            queryResult = await connection.query(strStatement);
        } catch (error) {
            console.error(`Failed to query ListID and Name from list table ${listID}\n\t${error}`);
        }

        return queryResult;
    },

    /*
    Add a new list
    */
    new: async (connection, collectionID, listName) => {
        const strStatement = strAddNewList(collectionID, listName);

        if (!connection || !strStatement) {
            return false;
        }

        try {
            await connection.query(strStatement);

            return true;
        } catch (error) {
            console.error(`Failed to insert a new list into collection ${collectionID}\n\t${error}`);
        }

        return false;
    }
}