const bigint = require("../utils/numbers/bigint");
const lists = require("./lists");
const { SqlError, ValueError } = require("../utils/errors/exceptions");

/*
Handling reading and writing of the collections SQL table
*/
const strRetrieveAll = "SELECT CollectionID, Name FROM collections";

function findByID(connection, collectionID) {
    if (!connection || !bigint.isValid(collectionID)) {
        throw new ValueError(400, "Invalid Collection ID");
    }

    return `SELECT CollectionID, Name FROM collections WHERE CollectionID = ${collectionID}`;
}

async function findID(connection, collectionName) {
    if (!connection || 
            !collectionName ||
            typeof collectionName !== "string") {
        throw new ValueError(400, "Invalid Collection Name");
    }

    let queryResult = null;
    try {
        queryResult = await connection.query(`SELECT Name FROM collections WHERE Name = "${collectionName.trim()}"`);
    } catch (error) {
        throw new SqlError(`Failed to find collection ${collectionName}: ${error.message}`);
    }

    return queryResult;
}

async function checkIfIDExists(connection, collectionID) {
    collectionID = bigint.toBigInt(collectionID);

    if (!connection || !bigint.isValid(collectionID)) {
        throw new ValueError(400, "Invalid Collection ID");
    }

    try {
        const queryResult = await connection.query(`SELECT COUNT(CollectionID) AS count FROM collections WHERE CollectionID = ${collectionID.toString()}`);
        return queryResult[0].count > 0;
    } catch (error) {
        throw new SqlError(`Failed to check if ID ${collectionID} exists: ${error.message}`);
    }
}

async function deleteAllLists(connection, collectionID) {
    collectionID = bigint.toBigInt(collectionID);

    if (!connection || !bigint.isValid(collectionID)) {
        throw new ValueError(400, "Invalid Connection Or CollectionID");
    }

    const collectionLists = await lists.find(connection, collectionID);

    for (let list of collectionLists) {
        await lists.delete(connection, collectionID, list.ListID);
    }
}

module.exports = {
    /*
    Check if ID exists
    */
    exists: checkIfIDExists,

    /*
    Return the list of items inside the collections SQL table
    */
    find: async function(connection, collectionID) {
        collectionID = bigint.toBigInt(collectionID);

        if (!connection || (collectionID && !bigint.isValid(collectionID))) {
            throw new ValueError(400, "Invalid Collection ID");
        }

        let queryResult;
        try {
            if (collectionID) {
                queryResult = await connection.query(findByID(connection, collectionID))
            } else {
                queryResult = await connection.query(strRetrieveAll);
            }
        } catch (error) {
            throw new SqlError(`Failed to find collections: ${error.message}`);
        }

        return queryResult;
    },

    /*
    Return the name and the id of a collection from a CollectionID
    */
    findNameAndID: async function(connection, collectionID) {
        collectionID = bigint.toBigInt(collectionID);

        if (!connection || !bigint.isValid(collectionID)) {
            throw new ValueError(400, "Invalid Collection ID");
        }

        let queryResult = null;
        try {
            queryResult = await connection.query(`SELECT CollectionID, Name FROM collections WHERE CollectionID = ${collectionID.toString()}`);
            if (queryResult.length === 0) {
                queryResult = null;
            }
        } catch (error) {
            throw new SqlError(`Failed to find the name and the ID of the collection: ${error.message}`);
        }

        return queryResult;
    },

    /*
    Get CollectionID from name
    */
    findID,

    /*
    Adding a new collection
    */
    new: async function(connection, collectionData) {
        if (!connection || 
                typeof collectionData !== "object" ||
                typeof collectionData.Name !== "string" ||
                collectionData.Name.trim().length === 0) {
            throw new ValueError(400, "Invalid Collection Name");
        }

        const Name = collectionData.Name.trim();

        // Do not allow collection duplicate
        if ((await findID(connection, Name)).length > 0) {
            return false;
        }

        try {
            await connection.query(`INSERT INTO collections (Name) VALUES ("${Name}")`);
        } catch (error) {
            throw new SqlError(`Failed to insert a new collection: ${error.message}`);
        }

        return true;
    },

    /*
    Edit a collection
    */
    edit: async function(connection, collectionData) {
        if (!connection ||
                typeof collectionData !== "object" ||
                typeof collectionData.data !== "object" ||
                typeof collectionData.data.Name !== "string" ||
                collectionData.data.Name.trim().length === 0 ||
                !bigint.isValid(collectionData.data.CollectionID)) {
            throw new ValueError(400, "Invalid Collection ID or Name");
        }

        const collectionID = collectionData.data.CollectionID;
        const name = collectionData.data.Name.trim();

        // Do not allow for duplicate or same name has the current one
        if ((await findID(connection, name)).length > 0) {
            throw ValueError(400, "There can't be any dupplicate");
        }

        try {
            await connection.query(`UPDATE collections SET Name = "${name}" WHERE CollectionID = ${collectionID}`);
        } catch (error) {
            throw new SqlError(`Failed to edit a collection ${error.message}`);
        }

        return true;
    },

    /*
    Delete a collection by ID
    */
    delete: async function(connection, collectionID) {
        collectionID = bigint.toBigInt(collectionID);

        if (!connection || !bigint.isValid(collectionID)) {
            throw new ValueError(400, "Invalid Collection ID");
        }

        if (!await checkIfIDExists(connection, collectionID)) {
            return null;
        }

        await deleteAllLists(connection, collectionID);

        try {
            await connection.query(`DELETE FROM collections WHERE CollectionID = ${collectionID.toString()}`);
        } catch (error) {
            throw new SqlError(`Failed to delete collection ${collectionID}: ${error.message}`);
        }

        return true;
    }
}