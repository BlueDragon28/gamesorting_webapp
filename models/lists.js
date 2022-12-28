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
    }
}