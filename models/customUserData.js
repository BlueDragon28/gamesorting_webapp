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
        throw new SqlError("Invalid Connection");
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

function strGetCustomData(listColumnTypeID, itemID) {
    listColumnTypeID = bigint.toBigInt(listColumnTypeID);
    itemID = bigint.toBigInt(itemID);

    if (!bigint.isValid(listColumnTypeID) || !bigint.isValid(itemID)) {
        throw new ValueError(400, "Invalid ListColumnTypeID or ItemID");
    }

    return "SELECT r.CustomRowItemsID AS CustomRowItemsID, r.ItemID AS ItemID, r.ListColumnTypeID AS ListColumnTypeID, r.Value AS Value, l.Name AS ColumnName " +
           "FROM customRowsItems r " +
           "INNER JOIN items i ON r.ItemID = i.ItemID " +
           "INNER JOIN listColumnsType l ON r.ListColumnTypeID = l.ListColumnTypeID " +
           `WHERE r.ListColumnTypeID = ${listColumnTypeID} AND r.ItemID = ${itemID}`;
}

async function getCustomData(connection, listColumnTypeID, itemID) {
    const strStatement = strGetCustomData(listColumnTypeID, itemID);

    if (!connection || !strStatement) {
        throw new SqlError("Invalid Connection");
    }

    let queryResult;
    try {
        queryResult = await connection.query(strStatement);

        if (queryResult.length >= 1) {
            queryResult = queryResult[0];
        } else {
            queryResult = null;
        }
    } catch (error) {
        throw new SqlError(`Failed to get custom data from item ${itemID}: ${error.message}`);
    }

    return queryResult;
}

function strInsertCustomData(itemID, customData) {
    itemID = bigint.toBigInt(itemID);
    
    if (!bigint.isValid(itemID) || !customData || !customData.ListColumnTypeID || !customData.Value) {
        throw new ValueError(400, "Invalid Custom Column Data");
    }

    return "INSERT INTO customRowsItems(ItemID, ListColumnTypeID, Value) " +
           `VALUES (${itemID}, ${customData.ListColumnTypeID}, "${customData.Value}")`;
}

/*
Inserting the custom data into the item itemID
*/
async function insertCustomData(connection, itemID, customDatas) {
    if (!connection) {
        throw new SqlError("Invalid Connection");
    }

    for (let customData of customDatas) {
        // Do not add empty data
        if (customData.Value.trim().length === 0) {
            continue;
        }

        const strStatement = strInsertCustomData(itemID, customData);

        if (!strStatement) {
            throw new InternalError("Failed to make query statement");
        }

        try {
            await connection.query(strStatement);
        } catch (error) {
            throw new SqlError(`Failed to insert custom data of item ${itemID}: ${error.message}`);
        }
    }

    return true;
}

function strDeleteCustomDatas(itemID) {
    itemID = bigint.toBigInt(itemID);

    if (!bigint.isValid(itemID)) {
        throw new ValueError(400, "Invalid ItemID");
    }

    return `DELETE FROM customRowsItems WHERE ItemID = ${itemID}`;
}

/*
Delete all custom data of a specific itemID
*/
async function deleteCustomDatasFromItemID(connection, itemID) {
    const strStatement = strDeleteCustomDatas(itemID);

    if (!connection || !strStatement) {
        throw new SqlError("Invalid Connection");
    }

    try {
        await connection.query(strStatement);
    } catch (error) {
        throw new SqlError(`Failed to delete custom datas from item ${itemID}: ${error.message}`);
    }

    return true;
}

module.exports = {
    getListColumnsType,
    getCustomData,
    insert: insertCustomData,
    delete: deleteCustomDatasFromItemID
};