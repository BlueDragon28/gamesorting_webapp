const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError, InternalError } = require("../utils/errors/exceptions");

const dataType = {
    string: "@String",
    int: "@Int"
};

function strGetListColumnsType(listID) {
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(listID)) {
        throw new ValueError(400, "Invalid ListID");
    }

    return "SELECT c.ListColumnTypeID AS ListColumnTypeID, c.ListID AS ListID, c.Name AS Name, c.Type AS Type " +
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
        queryResult = await connection.query(strStatement);

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
    
    if (!bigint.isValid(itemID) || !customData || !customData.ListColumnTypeID || 
            (!customData.Value || !customData.Value.trim().length === 0)) {
        throw new ValueError(400, "Invalid Custom Column Data");
    }

    return "INSERT INTO customRowsItems(ItemID, ListColumnTypeID, Value) " +
           `VALUES (${itemID}, ${customData.ListColumnTypeID}, "${customData.Value.trim()}")`;
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

function strDeleteListColumnsType(listID) {
    listID = bigint.toBigInt(listID);

    if (!bigint.isValid(listID)) {
        throw new ValueError(400, "Invalid ListID");
    }

    return `DELETE FROM listColumnsType WHERE ListID = ${listID}`;
}

/*
Delete list columns type information from a listID
*/
async function deleteListColumnsType(connection, listID) {
    const strStatement = strDeleteListColumnsType(listID);

    if (!connection || !strStatement) {
        throw new SqlError("Invalid Connection");
    }

    try {
        await connection.query(strStatement);
    } catch (error) {
        throw new SqlError(`Failed to delete list columns type informations form list ${listID}: ${error.message}`);
    }

    return true;
}

function strEditCustomDatas(itemID, customData) {
    itemID = bigint.toBigInt(itemID);

    if (!bigint.isValid(itemID) || !customData || !customData.CustomRowItemsID || typeof customData.Value !== "string") {
        throw new ValueError(400, "Invalid itemID or customData");
    }

    const value = customData.Value.trim();

    if (value.length > 0) {
        if (customData.CustomRowItemsID >= 0) {
            return `UPDATE customRowsItems SET Value = "${value}" WHERE CustomRowItemsID = ${customData.CustomRowItemsID}`;
        } else {
            return "INSERT INTO customRowsItems(ItemID, ListColumnTypeID, Value) " +
                   `VALUES (${itemID}, ${-customData.CustomRowItemsID}, "${value}")`;
        }
    } else {
        return `DELETE FROM customRowsItems WHERE CustomRowItemsID = ${customData.CustomRowItemsID}`;
    }
}

/*
Edit all custom data of a specific itemID.
If a Value is null, it will remove the existing customData
*/
async function editCustomDatasFromItemID(connection, itemData) {
    const itemID = itemData.data.ItemID;
    const customDatas = itemData.data.customData;

    if (!connection) {
        throw new SqlError("Invalid Connection!");
    }

    for (let customData of customDatas) {
        const strStatement = strEditCustomDatas(itemID, customData);

        if (!strStatement) {
            throw new InternalError("Failed to make a query statement");
        }

        try {
            await connection.query(strStatement);
        } catch (error) {
            throw new SqlError(`Failed to update customData ${customData.CustomRowItemsID}: ${error.message}`);
        }
    }

    return true;
}

function strGetColumnTypeFromID(id) {
    id = bigint.toBigInt(id);

    if (!bigint.isValid(id)) {
        throw new ValueError(400, "Invalid Custom Column ID");
    }

    return "SELECT Type FROM listColumnsType " +
           `WHERE ListColumnTypeID = ${id}`;
}

/*
Retrieve the type of the column base on the column ID
*/
async function getColumnTypeFromID(connection, id) {
    const strStatement = strGetColumnTypeFromID(id);   

    if (!connection || !strStatement) {
        throw new ValueError(400, "Invalid Connection");
    }
    
    try {
        const queryResult = await connection.query(strStatement);
        
        if (!queryResult || !queryResult.length || !queryResult[0].Type) {
            return null;
        }

        return queryResult[0].Type;
    } catch (error) {
        throw new SqlError(`Failed to retrieve Type from column list ${id}: ${error.message}`);
    }
}

function strGetColumnTypeFromRowID(id) {
    id = bigint.toBigInt(id);

    if (!bigint.isValid(id)) {
        throw new ValueError(400, "Invalid Row ID");
    }

    return "SELECT Type FROM customRowsItems INNER JOIN listColumnsType USING (listColumnTypeID) " +
           `WHERE CustomRowItemsID = ${id}`;
}

/*
Retrieve the type of the column base on the row ID
*/
async function getColumnTypeFromRowID(connection, id) {
    id = bigint.toBigInt(id);

    if (!id) {
        throw new ValueError(400, "Invalid Row ID");
    }

    // If id is less than 0, it mean that id link to a column id, not a row id
    if (id < 0n) {
        return await getColumnTypeFromID(connection, -id);
    }

    const strStatement = strGetColumnTypeFromRowID(id);

    if (!connection || !strStatement) {
        throw new ValueError(400, "Invalid Connection");
    }

    try  {
        const queryResult = await connection.query(strStatement);
       
        if (!queryResult || !queryResult.length || !queryResult[0].Type) {
            return null;
        }

        return queryResult[0].Type;
    } catch (error) {
        throw new SqlError(`Failed to retrieve column type from row ID ${id}: ${error.message}`)
    }
}

module.exports = {
    getListColumnsType,
    deleteColumns: deleteListColumnsType,
    getCustomData,
    insert: insertCustomData,
    delete: deleteCustomDatasFromItemID,
    edit: editCustomDatasFromItemID,

    type: dataType,
    getColumnTypeFromID,
    getColumnTypeFromRowID
};
