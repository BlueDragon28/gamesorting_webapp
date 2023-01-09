const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError, InternalError } = require("../utils/errors/exceptions");

function strGetListColumnsType(listID) {
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(listID)) {
        throw new ValueError(400, "Invalid ListID");
    }

    return "SELECT c.ListColumnTypeID AS ListColumnTypeID, c.ListID AS ListID, c.Name AS Name, c.Type AS Type, c.Position AS Position " +
           "FROM listColumnsType c " +
           "INNER JOIN lists l USING (ListID) " +
           `WHERE c.ListID = ${listID}`;
}

async function getListColumnsType(connection, listID) {
    const strStatement = strGetListColumnsType(listID);

    if (!connection || !strGetListColumnsType) {
        throw new InternalError("Invalid Connection");
    }

    let queryResult;
    try {
        queryResult = connection.query(strStatement);

        if (!queryResult) {
            throw new Error("Return query result is invalid");
        }
    } catch (error) {
        throw new SqlError(`Failed to get custom columns type from list ${listID}: ${error.message}`)
    }

    return queryResult;
}

module.exports = {
    getListColumnsType
};