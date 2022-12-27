/*
Handling reading and writing of the collections SQL table
*/
const strRetrieveAll = "SELECT CollectionID, Name FROM collections";

const findID = async (connection, collectionName) => {
    if (!connection || 
            (!collectionName &&
            typeof collectionName !== "string")) {
        return null;
    }

    let queryResult = null;
    try {
        queryResult = await connection.query(`SELECT Name FROM collections WHERE Name = "${collectionName}"`);
    } catch (error) {
        console.error(`Failed to retrieve collection id from name\n\t${error}`);
    }

    return queryResult;
}

module.exports = {
    /*
    Return the list of items inside the collections SQL table
    */
    find: async (connection) => {
        if (!connection) {
            return null;
        }

        let queryResult;
        try {
            queryResult = await connection.query(strRetrieveAll);
        } catch (error) {
            console.error(`Failed to query data from collections SQL table\n\t${error}`)
        }

        return queryResult;
    },

    /*
    Return the name of a collection from a CollectionID
    */
    findName: async (connection, collectionID) => {
        if (!connection || !collectionID || 
                (typeof collectionID !== "number" && 
                 typeof collectionID !== "bigint" &&
                 typeof collectionID !== "string")) {
            return null;
        }

        if (typeof collectionID === "string") {
            try {
                collectionID = BigInt(collectionID);
            } catch {
                return null;
            }
        }

        let queryResult = null;
        try {
            queryResult = await connection.query(`SELECT Name FROM collections WHERE CollectionID = ${collectionID.toString()}`);
            if (queryResult.length === 1) {
                queryResult = queryResult[0].Name;
            } else {
                queryResult = null;
            }
        } catch {
            console.error("Failed to get the name of a collection.");
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
    new: async (connection, collectionName) => {
        if (!connection || 
                (!collectionName &&
                typeof collectionName !== "string")) {
            return null;
        }

        // Do not allow collection duplicate
        if ((await findID(connection, collectionName)).length > 0) {
            return false;
        }

        try {
            await connection.query(`INSERT INTO collections (Name) VALUES ("${collectionName}")`);
        } catch (error) {
            console.error(`Failed to insert a new collection.\n\t${error}`);
            return false;
        }

        return true;
    }
}