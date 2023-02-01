const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError, InternalError } = require("../utils/errors/exceptions");
const { sqlString, existingOrNewConnection } = require("../utils/sql/sql");

const dataType = {
    string: "@String",
    int: "@Int"
};

//function strGetListColumnsType(listID) {
    //listID = bigint.toBigInt(listID);

    //if (!bigint.isValid(listID)) {
        //throw new ValueError(400, "Invalid ListID");
    //}

    //return "SELECT c.ListColumnTypeID AS ListColumnTypeID, c.ListID AS ListID, c.Name AS Name, c.Type AS Type " +
           //"FROM listColumnsType c " +
           //"INNER JOIN lists l USING (ListID) " +
           //`WHERE c.ListID = ${listID}`;
//}

//async function getListColumnsType(connection, listID) {
    //const strStatement = strGetListColumnsType(listID);

    //if (!connection || !strGetListColumnsType) {
        //throw new SqlError("Invalid Connection");
    //}

    //let queryResult;
    //try {
        //queryResult = await connection.query(strStatement);

        //if (!queryResult) {
            //throw new Error("Return query result is invalid");
        //}
    //} catch (error) {
        //throw new SqlError(`Failed to get custom columns type from list ${listID}: ${error.message}`)
    //}

    //return queryResult;
//}

//function strGetCustomData(listColumnTypeID, itemID) {
    //listColumnTypeID = bigint.toBigInt(listColumnTypeID);
    //itemID = bigint.toBigInt(itemID);

    //if (!bigint.isValid(listColumnTypeID) || !bigint.isValid(itemID)) {
        //throw new ValueError(400, "Invalid ListColumnTypeID or ItemID");
    //}

    //return "SELECT r.CustomRowItemsID AS CustomRowItemsID, r.ItemID AS ItemID, r.ListColumnTypeID AS ListColumnTypeID, r.Value AS Value, l.Name AS ColumnName " +
           //"FROM customRowsItems r " +
           //"INNER JOIN items i ON r.ItemID = i.ItemID " +
           //"INNER JOIN listColumnsType l ON r.ListColumnTypeID = l.ListColumnTypeID " +
           //`WHERE r.ListColumnTypeID = ${listColumnTypeID} AND r.ItemID = ${itemID}`;
//}

//async function getCustomData(connection, listColumnTypeID, itemID) {
    //const strStatement = strGetCustomData(listColumnTypeID, itemID);

    //if (!connection || !strStatement) {
        //throw new SqlError("Invalid Connection");
    //}

    //let queryResult;
    //try {
        //queryResult = await connection.query(strStatement);

        //if (queryResult.length >= 1) {
            //queryResult = queryResult[0];
        //} else {
            //queryResult = null;
        //}
    //} catch (error) {
        //throw new SqlError(`Failed to get custom data from item ${itemID}: ${error.message}`);
    //}

    //return queryResult;
//}

//function strInsertCustomData(itemID, customData) {
    //itemID = bigint.toBigInt(itemID);
    
    //if (!bigint.isValid(itemID) || !customData || !customData.ListColumnTypeID || 
            //(!customData.Value || !customData.Value.trim().length === 0)) {
        //throw new ValueError(400, "Invalid Custom Column Data");
    //}

    //return "INSERT INTO customRowsItems(ItemID, ListColumnTypeID, Value) " +
           //`VALUES (${itemID}, ${customData.ListColumnTypeID}, "${customData.Value.trim()}")`;
//}

//[>
//Inserting the custom data into the item itemID
//*/
//async function insertCustomData(connection, itemID, customDatas) {
    //if (!connection) {
        //throw new SqlError("Invalid Connection");
    //}

    //for (let customData of customDatas) {
        //// Do not add empty data
        //if (customData.Value.trim().length === 0) {
            //continue;
        //}

        //const strStatement = strInsertCustomData(itemID, customData);

        //if (!strStatement) {
            //throw new InternalError("Failed to make query statement");
        //}

        //try {
            //await connection.query(strStatement);
        //} catch (error) {
            //throw new SqlError(`Failed to insert custom data of item ${itemID}: ${error.message}`);
        //}
    //}

    //return true;
//}

//function strDeleteCustomDatas(itemID) {
    //itemID = bigint.toBigInt(itemID);

    //if (!bigint.isValid(itemID)) {
        //throw new ValueError(400, "Invalid ItemID");
    //}

    //return `DELETE FROM customRowsItems WHERE ItemID = ${itemID}`;
//}

//[>
//Delete all custom data of a specific itemID
//*/
//async function deleteCustomDatasFromItemID(connection, itemID) {
    //const strStatement = strDeleteCustomDatas(itemID);

    //if (!connection || !strStatement) {
        //throw new SqlError("Invalid Connection");
    //}

    //try {
        //await connection.query(strStatement);
    //} catch (error) {
        //throw new SqlError(`Failed to delete custom datas from item ${itemID}: ${error.message}`);
    //}

    //return true;
//}

//function strDeleteListColumnsType(listID) {
    //listID = bigint.toBigInt(listID);

    //if (!bigint.isValid(listID)) {
        //throw new ValueError(400, "Invalid ListID");
    //}

    //return `DELETE FROM listColumnsType WHERE ListID = ${listID}`;
//}

//[>
//Delete list columns type information from a listID
//*/
//async function deleteListColumnsType(connection, listID) {
    //const strStatement = strDeleteListColumnsType(listID);

    //if (!connection || !strStatement) {
        //throw new SqlError("Invalid Connection");
    //}

    //try {
        //await connection.query(strStatement);
    //} catch (error) {
        //throw new SqlError(`Failed to delete list columns type informations form list ${listID}: ${error.message}`);
    //}

    //return true;
//}

//function strEditCustomDatas(itemID, customData) {
    //itemID = bigint.toBigInt(itemID);

    //if (!bigint.isValid(itemID) || !customData || !customData.CustomRowItemsID || typeof customData.Value !== "string") {
        //throw new ValueError(400, "Invalid itemID or customData");
    //}

    //const value = customData.Value.trim();

    //if (value.length > 0) {
        //if (customData.CustomRowItemsID >= 0) {
            //return `UPDATE customRowsItems SET Value = "${value}" WHERE CustomRowItemsID = ${customData.CustomRowItemsID}`;
        //} else {
            //return "INSERT INTO customRowsItems(ItemID, ListColumnTypeID, Value) " +
                   //`VALUES (${itemID}, ${-customData.CustomRowItemsID}, "${value}")`;
        //}
    //} else {
        //return `DELETE FROM customRowsItems WHERE CustomRowItemsID = ${customData.CustomRowItemsID}`;
    //}
//}

//[>
//Edit all custom data of a specific itemID.
//If a Value is null, it will remove the existing customData
//*/
//async function editCustomDatasFromItemID(connection, itemData) {
    //const itemID = itemData.data.ItemID;
    //const customDatas = itemData.data.customData;

    //if (!connection) {
        //throw new SqlError("Invalid Connection!");
    //}

    //for (let customData of customDatas) {
        //const strStatement = strEditCustomDatas(itemID, customData);

        //if (!strStatement) {
            //throw new InternalError("Failed to make a query statement");
        //}

        //try {
            //await connection.query(strStatement);
        //} catch (error) {
            //throw new SqlError(`Failed to update customData ${customData.CustomRowItemsID}: ${error.message}`);
        //}
    //}

    //return true;
//}

//function strGetColumnTypeFromID(id) {
    //id = bigint.toBigInt(id);

    //if (!bigint.isValid(id)) {
        //throw new ValueError(400, "Invalid Custom Column ID");
    //}

    //return "SELECT Type FROM listColumnsType " +
           //`WHERE ListColumnTypeID = ${id}`;
//}

//[>
//Retrieve the type of the column base on the column ID
//*/
//async function getColumnTypeFromID(connection, id) {
    //const strStatement = strGetColumnTypeFromID(id);   

    //if (!connection || !strStatement) {
        //throw new ValueError(400, "Invalid Connection");
    //}
    
    //try {
        //const queryResult = await connection.query(strStatement);
        
        //if (!queryResult || !queryResult.length || !queryResult[0].Type) {
            //return null;
        //}

        //return queryResult[0].Type;
    //} catch (error) {
        //throw new SqlError(`Failed to retrieve Type from column list ${id}: ${error.message}`);
    //}
//}

//function strGetColumnTypeFromRowID(id) {
    //id = bigint.toBigInt(id);

    //if (!bigint.isValid(id)) {
        //throw new ValueError(400, "Invalid Row ID");
    //}

    //return "SELECT Type FROM customRowsItems INNER JOIN listColumnsType USING (listColumnTypeID) " +
           //`WHERE CustomRowItemsID = ${id}`;
//}

//[>
//Retrieve the type of the column base on the row ID
//*/
//async function getColumnTypeFromRowID(connection, id) {
    //id = bigint.toBigInt(id);

    //if (!id) {
        //throw new ValueError(400, "Invalid Row ID");
    //}

    //// If id is less than 0, it mean that id link to a column id, not a row id
    //if (id < 0n) {
        //return await getColumnTypeFromID(connection, -id);
    //}

    //const strStatement = strGetColumnTypeFromRowID(id);

    //if (!connection || !strStatement) {
        //throw new ValueError(400, "Invalid Connection");
    //}

    //try  {
        //const queryResult = await connection.query(strStatement);
       
        //if (!queryResult || !queryResult.length || !queryResult[0].Type) {
            //return null;
        //}

        //return queryResult[0].Type;
    //} catch (error) {
        //throw new SqlError(`Failed to retrieve column type from row ID ${id}: ${error.message}`)
    //}
//}

//module.exports = {
    //getListColumnsType,
    //deleteColumns: deleteListColumnsType,
    //getCustomData,
    //insert: insertCustomData,
    //delete: deleteCustomDatasFromItemID,
    //edit: editCustomDatasFromItemID,

    //type: dataType,
    //getColumnTypeFromID,
    //getColumnTypeFromRowID
//};

class CustomRowsItems {
    id;
    value;
    itemID;
    columnTypeID;

    constructor(value, itemID, columnTypeID) {
        if (value && typeof value === "string") {
            this.value = value;
        }

        if (itemID) {
            this.itemID = itemID;
        }

        if (columnTypeID) {
            this.columnTypeID = columnTypeID;
        }
    }

    isValid() {
        this.id = this.id ? bigint.toBigInt(this.id) : undefined;
        this.itemID = this.itemID ? bigint.toBigInt(this.itemID) : undefined;
        this.columnTypeID = this.columnTypeID ? bigint.toBigInt(this.columnTypeID) : undefined;
        if (typeof this.value === "string") {
            this.value = this.value.trim();
        }
        
        if ((this.id && !bigint.isValid(this.id)) ||
            !this.itemID || (this.itemID && !bigint.isValid(this.itemID)) ||
            !this.columnTypeID || (this.columnTypeID && !bigint.isValid(this.columnTypeID)) ||
            !this.value || typeof this.value !== "string" || !this.value.length) {
            return false;
        }

        return true;
    }

    async save(connection) {
        const isCustomDataExisting = await this.exists(connection);

        if (!this.isValid(connection)) {
            throw new ValueError(400, "Invalid Custom Data Name");
        }

        if (!isCustomDataExisting) {
            await this.#createCustomRowItem(connection);
        } else {
            await this.#updateCustomRowItem(connection);
        }
    }

    async delete(connection) {
        if (!bigint.isValid(this.id)) {
            return;
        }

        await CustomRowsItems.deleteFromID(this.id, connection)
    }

    async exists(connection) {
        if (!this.id) {
            return false;
        }

        return existingOrNewConnection(connection, this.#_exists.bind(this));
    }

    async #_exists(connection) {
        if (!this.isValid()) {
            return false;
        }

        const queryStatement = `SELECT COUNT(1) AS count FROM customRowsItems WHERE CustomRowItemsID = ${this.id}`

        try {
            const queryResult = (await connection.query(queryStatement))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check if custom data exists: ${error.message}`);
        }
    }

    async #createCustomRowItem(connection) {
        return await existingOrNewConnection(connection, this.#_createCustomRowItem.bind(this));
    }

    async #_createCustomRowItem(connection) {
        const queryStatement = `INSERT INTO customRowsItems(ItemID, ListColumnTypeID, Value) ` +
            `VALUES (${this.itemID}, ${this.columnTypeID}, "${sqlString(this.value)}")`;

        try {
            const queryResult = await connection.query(queryStatement);

            this.id = queryResult.insertId;

            if (!this.id || !bigint.isValid(this.id)) {
                throw new Error("Invalid ID");
            }
        } catch (error) {
            throw new SqlError(`Failed to insert a item: ${error.message}`);
        }
    }

    async #updateCustomRowItem(connection) {
        return await existingOrNewConnection(connection, this.#_updateCustomRowItem.bind(this));
    }

    async #_updateCustomRowItem(connection) {
        const queryStatement = 
            `UPDATE customRowsItems SET Value = "${sqlString(this.value)}" WHERE CustomRowItemsID = ${this.id} `;

        try {
            const result = await connection.query(queryStatement);
        } catch (error) {
            throw new SqlError(`Failed to update custom data: ${error.message}`);
        }
    }

    static async findByID(id, connection) {
        id = bigint.toBigInt(id);

        if (!bigint.isValid(id)) {
            return null; 
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT CustomRowItemsID, ItemID, ListColumnTypeID, Value " +
                "FROM customRowsItems " + 
                `WHERE CustomRowItemsID = ${id}`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return null;
                }
                
                const { CustomRowItemsID, Value, ItemID, ListColumnTypeID } = queryResult[0];
                const foundCustomData = new CustomRowsItems(Value, ItemID, ListColumnTypeID);
                foundCustomData.id = CustomRowItemsID;

                if (!foundCustomData.isValid()) {
                    return null;
                }

                return foundCustomData;
            } catch (error) {
                throw new SqlError(`Failed to get custom data from ID: ${error.message}`);
            }
        });
    }

    static async findFromItem(itemID, connection) {
        if (!bigint.isValid(itemID)) {
            throw new ValueError(400, "Invalid List");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `SELECT CustomRowItemsID, ItemID, ListColumnTypeID, Value FROM customRowsItems ` +
                `WHERE ItemID = ${itemID};`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return [];
                }

                return CustomRowsItems.#parseFoundCustomRowData(queryResult);
            } catch (error) {
                throw new SqlError(`Failed to get all custom data: ${error.message}`);
            }
        });
    }

    static async deleteFromID(id, connection) {
        id = bigint.toBigInt(id);
        if (!bigint.isValid(id)) {
            throw new ValueError(400, "Invalid Custom Data ID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `DELETE FROM customRowsItems WHERE CustomRowItemsID = ${id}`;

            try {
                const queryResult = await connection.query(queryStatement);
            } catch (error) {
                throw new SqlError(`Failed to delete custom data ${id}: ${error.message}`);
            }
        });
    }

    static #parseFoundCustomRowData(customData) {
        const customRowsItemArray = [];

        for (let data of customData) {
            const item = new CustomRowsItems(data.Value, data.ItemID, data.ListColumnTypeID);
            item.id = data.CustomRowItemsID;

            if (item.isValid()) {
                customRowsItemArray.push(item);
            } 
        }
        
        return customRowsItemArray;
    }
}

module.exports = {
    CustomRowsItems
}
