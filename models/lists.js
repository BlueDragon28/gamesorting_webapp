const bigint = require("../utils/numbers/bigint");

/*
Statement to query the lists available in a collection
*/
function strRetrieveListsFromCollection(collectionID, listID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(collectionID)) {
        return null;
    }

    let strStatement = `SELECT ListID, Name FROM lists WHERE CollectionID = ${collectionID.toString()}`;

    if (bigint.isValid(listID)) {
        strStatement += ` AND ListID = ${listID}`;
    }

    return strStatement;
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

function strDeleteList(collectionID, listID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(collectionID) || !bigint.isValid(listID)) {
        return null;
    }

    return `DELETE FROM lists WHERE CollectionID = ${collectionID} AND ListID = ${listID}`;
}

function strCheckForDuplicate(collectionID, listName) {
    collectionID = bigint.toBigInt(collectionID);

    if (!bigint.isValid(collectionID) || typeof listName !== "string" || listName.length === 0) {
        return null;
    }

    return "SELECT COUNT(ListID) AS count FROM lists " +
           "INNER JOIN collections USING (CollectionID) " +
           `WHERE lists.Name = "${listName}" AND collections.CollectionID = ${collectionID}`;
}

const checkIfListExists = async (connection, collectionID, listID) => {
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
}

/*
Check if a list do not alrady exists
*/
const checkForDuplicate = async (connection, collectionID, listName) => {
    const strStatement = strCheckForDuplicate(collectionID, listName);

    if (!connection || !strStatement) {
        return false;
    }

    try {
        const queryResult = await connection.query(strStatement);

        if (queryResult[0].count > 0n) {
            return true;
        }
    } catch (error) {
        console.log(`Failed to check if a list already exists\n\t${error}`);
    }

    return false;
}

module.exports = {
    /*
    Check if a list exist and is part of a collection.
    */
    exists: checkIfListExists,

    /*
    Returning the lists available inside a collection
    */
    find: async (connection, collectionID, listID) => {
        const strStatement = strRetrieveListsFromCollection(collectionID, listID);

        if (!connection || !strStatement) {
            return null;
        }

        let queryResult = null;
        try {
            queryResult = await connection.query(strStatement);

            if (bigint.isValid(listID) && queryResult.length > 0) {
                queryResult = queryResult[0];
            }
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
    new: async (connection, list) => {
        const strStatement = strAddNewList(
            list.parent.collection.CollectionID,
            list.data.Name
        );

        if (!connection || !strStatement) {
            return false;
        }

        if (await checkForDuplicate(connection, list.parent.collection.CollectionID, list.data.Name)) {
            return false;
        }

        try {
            await connection.query(strStatement);

            return true;
        } catch (error) {
            console.error(`Failed to insert a new list into collection ${list.parent.collection.CollectionID}\n\t${error}`);
        }

        return false;
    },

    /*
    Delete a list
    */
    delete: async (connection, collectionID, listID) => {
        const strStatement = strDeleteList(collectionID, listID);

        if (!connection || !strStatement) {
            return false;
        }

        try {
            await connection.query(strStatement);

            return true;
        } catch (error) {
            console.error(`Failed to delete a list from collection ${collectionID}\n\t${error}`);
        }

        return false;
    }
}