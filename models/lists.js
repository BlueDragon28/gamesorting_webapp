const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError } = require("../utils/errors/exceptions");

/*
Statement to query the lists available in a collection
*/
function strRetrieveListsFromCollection(collectionID, listID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(collectionID) || (listID && !bigint.isValid(listID))) {
        throw new ValueError(400, "Invalid CollectionID or List ID");
    }

    let strStatement = "SELECT l.ListID, l.Name FROM lists l " + 
        "INNER JOIN collections c USING (CollectionID) " +
        `WHERE c.CollectionID = ${collectionID.toString()}`;

    if (bigint.isValid(listID)) {
        strStatement += ` AND ListID = ${listID}`;
    }

    return strStatement;
}

function strRetrieveNameAndIDFromListID(collectionID, listID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(collectionID) || !bigint.isValid(listID)) {
        throw new ValueError(400, "Invalid Collection ID or List ID");
    }

    return "SELECT l.ListID, l.Name FROM lists l " + 
        "INNER JOIN collections c USING (CollectionID) " +
        `WHERE c.CollectionID = ${collectionID.toString()} AND l.ListID = ${listID.toString()}`;
}

function strCheckIfListExists(collectionID, listID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(collectionID) || !bigint.isValid(listID)) {
        throw new ValueError(400, "Invalid Collection ID or List ID");
    }

    return "SELECT COUNT(l.ListID) AS count FROM lists l " +
           "INNER JOIN collections c USING (CollectionID) " +
           `WHERE l.ListID = ${listID} AND c.CollectionID = ${collectionID}`;
}

function strAddNewList(collectionID, listName) {
    collectionID = bigint.toBigInt(collectionID);

    if (!bigint.isValid(collectionID) || (typeof listName !== "string" || listName.trim().length === 0)) {
        throw new ValueError(400, "Invalid CollectionID or List Name");
    }

    return "INSERT INTO lists(CollectionID, Name) " +
           `VALUES (${collectionID}, "${listName.trim()}")`;
}

function strEditList(listID, listName) {
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(listID) || (typeof listName !== "string" || listName.trim().length === 0)) {
        throw new ValueError(400, "Invalid ListID or Name");
    }

    return `UPDATE lists SET Name = "${listName}" WHERE ListID = ${listID}`;
} 

function strDeleteList(collectionID, listID) {
    collectionID = bigint.toBigInt(collectionID);
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(collectionID) || !bigint.isValid(listID)) {
        throw new ValueError(400, "Invalid Collection ID or List ID");
    }

    return `DELETE FROM lists WHERE CollectionID = ${collectionID} AND ListID = ${listID}`;
}

function strCheckForDuplicate(collectionID, listName) {
    collectionID = bigint.toBigInt(collectionID);

    if (!bigint.isValid(collectionID) || typeof listName !== "string" || listName.trim().length === 0) {
        throw new ValueError(400, "Invalid Collection ID or List Name");
    }

    return "SELECT COUNT(l.ListID) AS count FROM lists l " +
           "INNER JOIN collections c USING (CollectionID) " +
           `WHERE l.Name = "${listName.trim()}" AND c.CollectionID = ${collectionID}`;
}

async function checkIfListExists(connection, collectionID, listID) {
    const strStatement = strCheckIfListExists(collectionID, listID);

    if (!connection || !strStatement) {
        throw new SqlError("Failed to prepare statement");
    }

    try {
        const queryResult = await connection.query(strStatement);
        if (queryResult[0].count > 0) {
            return true;
        }
    } catch (error) {
        throw new SqlError(`Failed to check if list ${listID} exists: ${error.message}`);
    }

    return false;
}

/*
Check if a list do not alrady exists
*/
async function checkForDuplicate(connection, collectionID, listName) {
    const strStatement = strCheckForDuplicate(collectionID, listName);

    if (!connection || !strStatement) {
        throw new SqlError("Failed to prepare statement");
    }

    try {
        const queryResult = await connection.query(strStatement);

        if (queryResult[0].count > 0n) {
            return true;
        }
    } catch (error) {
        throw new SqlError(`Failed to check for duplicate in list: ${error.message}`);
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
    find: async function(connection, collectionID, listID) {
        const strStatement = strRetrieveListsFromCollection(collectionID, listID);

        if (!connection || !strStatement) {
            throw new SqlError("Failed to prepare statement");
        }

        let queryResult = null;
        try {
            queryResult = await connection.query(strStatement);

            if (bigint.isValid(listID) && queryResult.length > 0) {
                queryResult = queryResult[0];
            }
        } catch (error) {
            throw new SqlError(`Failed to find lists: ${error.message}`);
        }

        return queryResult;
    },

    /*
    Return the name and id of a list from a ListID
    */
    findNameAndID: async function(connection, collectionID, listID) {
        const strStatement = strRetrieveNameAndIDFromListID(collectionID, listID);

        if (!connection || !strStatement) {
            throw new SqlError("Failed to prepare statement");
        }

        let queryResult = null;
        try {
            queryResult = await connection.query(strStatement);
        } catch (error) {
            throw new SqlError(`Failed to find list name and ID: ${error.message}`);
        }

        return queryResult;
    },

    /*
    Add a new list
    */
    new: async function(connection, list) {
        const strStatement = strAddNewList(
            list.parent.collection.CollectionID,
            list.data.Name
        );

        if (!connection || !strStatement) {
            throw new SqlError("Failed to prepare statement");
        }

        if (await checkForDuplicate(connection, list.parent.collection.CollectionID, list.data.Name)) {
            return false;
        }

        try {
            await connection.query(strStatement);
        } catch (error) {
            throw new SqlError(`Failed to insert a new list: ${error.message}`);
        }

        return true;
    },

    /*
    Edit a list name
    */
    edit: async function(connection, list) {
        const strStatement = strEditList(list.data.ListID, list.data.Name);
        const collectionID = bigint.toBigInt(list.parent.collection.CollectionID);

        if (!connection || !bigint.isValid(collectionID) || !strStatement) {
            throw new SqlError("Failed to prepare statement");
        }

        if (await checkForDuplicate(connection, collectionID, list.data.Name)) {
            throw new ValueError(400, "Dupplicate name are not allowed");
        }

        try {
            await connection.query(strStatement);
        } catch (error) {
            throw new SqlError(`Failed to update list ${list.data.ListID}`)
        }

        return true;
    },

    /*
    Delete a list
    */
    delete: async function(connection, collectionID, listID) {
        const strStatement = strDeleteList(collectionID, listID);

        if (!connection || !strStatement) {
            throw new SqlError("Failed to prepare statement");
        }

        try {
            await connection.query(strStatement);
        } catch (error) {
            throw new SqlError(`Failed to delete the list ${listID}: ${error.message}`);
        }

        return true;
    }
}