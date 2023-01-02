const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError } = require("../utils/errors/exceptions");

/*
Handling reading and writing of the collections SQL table
*/
const strRetrieveAll = "SELECT CollectionID, Name FROM collections";

const findByID = (connection, collectionID) => {
    if (!connection || !bigint.isValid(collectionID)) {
        throw new ValueError(400, "Invalid Collection ID");
    }

    return `SELECT CollectionID, Name FROM collections WHERE CollectionID = ${collectionID}`;
}

const findID = async (connection, collectionName) => {
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

const checkIfIDExists = async (connection, collectionID) => {
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

module.exports = {
    /*
    Check if ID exists
    */
    exists: checkIfIDExists,

    /*
    Return the list of items inside the collections SQL table
    */
    find: async (connection, collectionID) => {
        collectionID = bigint.toBigInt(collectionID);

        if (!connection || !bigint.isValid(collectionID)) {
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
    findNameAndID: async (connection, collectionID) => {
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
    new: async (connection, collectionData) => {
        if (!connection || 
                typeof collectionData !== "object" ||
                typeof collectionData.Name !== "string" ||
                collectionData.Name.length.trim().length === 0) {
            throw new ValueError(400, "Invalid Collection Name");
        }

        const { Name } = collectionData;
        Name = Name.trim();

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
    Delete a collection by ID
    */
    delete: async (connection, collectionID) => {
        collectionID = bigint.toBigInt(collectionID);

        if (!connection || !bigint.isValid(collectionID)) {
            throw new ValueError(400, "Invalid Collection ID");
        }

        if (!await checkIfIDExists(connection, collectionID)) {
            return null;
        }

        try {
            await connection.query(`DELETE FROM collections WHERE CollectionID = ${collectionID.toString()}`);
        } catch (error) {
            throw new SqlError(`Failed to delete collection ${collectionID}: ${error.message}`);
        }

        return true;
    }
}