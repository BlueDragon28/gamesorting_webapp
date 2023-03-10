const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError, InternalError } = require("../utils/errors/exceptions");
const { sqlString, existingOrNewConnection } = require("../utils/sql/sql");

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
        this.id = this.id !== undefined ? bigint.toBigInt(this.id) : undefined;
        this.itemID = this.itemID !== undefined ? bigint.toBigInt(this.itemID) : undefined;
        this.columnTypeID = this.columnTypeID !== undefined ? bigint.toBigInt(this.columnTypeID) : undefined;
        if (typeof this.value === "string") {
            this.value = this.value.trim();
        } else {
            this.value = undefined;
        }
        
        if ((this.id !== undefined && !bigint.isValid(this.id)) ||
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

    static async findFromListColumn(listColumnID, connection) {
        if (!bigint.isValid(listColumnID)) {
            throw new ValueError(400, "Invalid Custom List");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                "SELECT CustomRowItemsID, ItemID, ListColumnTypeID, Value FROM customRowsItems " +
                `WHERE ListColumnTypeID = ${listColumnID}`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return [];
                }

                return CustomRowsItems.#parseFoundCustomRowData(queryResult);
            } catch (error) {
                throw new SqlError(`Failed to get all custom data: ${error.message}`)
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

                if (queryResult.affectedRows === 0) {
                    throw new ValueError(400, "Invalid Custom Row Data ID");
                }
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
