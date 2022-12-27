/*
Handling reading and writing of the collections SQL table
*/
const strRetrieveAll = "SELECT CollectionID, Name FROM collections";

module.exports = {
    /*
    Return the list of items inside the collections SQL table.
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
    }
}