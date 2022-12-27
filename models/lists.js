/*
Statement to query the lists available in a collection
*/
function strRetrieveListsFromCollection(collectionID) {
    if (!collectionID ||
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

    return `SELECT ListID, Name FROM lists WHERE CollectionID = ${collectionID.toString()}`;
}

module.exports = {
    /*
    Returning the lists available inside a collection
    */
    find: async (connection, collectionID) => {
        if (!connection) {
            return null;
        }

        const strStatement = strRetrieveListsFromCollection(collectionID);

        if (!strStatement) {
            return null;
        }

        let queryResult = null;
        try {
            queryResult = await connection.query(strStatement);
        } catch (error) {
            console.error(`Failed to query data from lists SQL table\n\t${error}`)
        }

        return queryResult;
    }
}