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
    }
}