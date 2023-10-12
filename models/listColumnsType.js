const bigint = require("../utils/numbers/bigint");
const { List } = require("./lists");
const { SqlError, ValueError, InternalError } = require("../utils/errors/exceptions");
const { existingOrNewConnection } = require("../utils/sql/sql");

function toJSON(json) {
    return JSON.stringify(json, function(key, value) {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    });
}

class ListColumnType {
    id;
    name;
    type;
    parentList;

    constructor(name, type, parentList) {
        if (name && typeof name === "string") {
            this.name = name;
        }

        if (type && typeof type === "object") {
            this.type = type;
        }

        if (parentList && parentList instanceof List) {
            this.parentList = parentList;
        }
    }

    isValid() {
        this.id = this.id !== undefined ? bigint.toBigInt(this.id) : undefined;
        this.name = typeof this.name === "string" ? this.name.trim() : undefined;
        
        if ((this.id !== undefined && !bigint.isValid(this.id)) ||
            !this.name || typeof this.name !== "string" || !this.name.length ||
            !this.type || typeof this.type !== "object" || !this.type?.type || typeof this.type?.type !== "string" ||
            !this.parentList || !this.parentList instanceof List ||
            !this.parentList.isValid()) {
            return false;
        }

        if (this.type.min !== undefined) {
            this.type.min = parseInt(this.type.min);
        }

        if (this.type.max !== undefined) {
            this.type.max = parseInt(this.type.max);
        }

        return true;
    }

    async save(connection) {
        const isListColumnTypeExisting = await this.exists(connection);

        if (!this.isValid(connection) ||
            !bigint.isValid(this.parentList.id)) {
            throw new ValueError(400, "Invalid List Column Type Name");
        }

        if (await this.isDuplicate(connection)) {
            throw new ValueError(400, "List Column Type Name Is Already Used");
        }

        if (!isListColumnTypeExisting) {
            await this.#createListColumnType(connection);
        } else {
            await this.#updateListColumnType(connection);
        }
    }

    async delete(connection) {
        if (!this.isValid()) {
            return;
        }

        await ListColumnType.deleteFromID(this.id, connection);
    }

    async exists(connection) {
        if (!this.id) {
            return false;
        }

        return existingOrNewConnection(connection, this.#_exists.bind(this));
    }

    async isDuplicate(connection) {
        if (!this.isValid()) {
            return false;
        }

        return await existingOrNewConnection(connection, this.#_isDuplicate.bind(this));
    }

    toBaseObject() {
        if (!this.isValid()) return null;

        return {
            id: this.id,
            name: this.name,
            type: this.type,
            parentListID: this.parentList.id
        };
    }

    async #_exists(connection) {
        if (!this.isValid()) {
            return false;
        }

        const queryStatement = "SELECT COUNT(1) AS count FROM listColumnsType WHERE ListColumnTypeID = ?";

        const queryArgs = [
            this.id
        ];

        try {
            const queryResult = (await connection.query(queryStatement, queryArgs))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check if column type item exists: ${error.message}`);
        }
    }

    async #_isDuplicate(connection) {
        const queryStatement = 
            "SELECT COUNT(1) as count FROM listColumnsType " +
            "WHERE Name = ? AND ListID = ? " +
            "LIMIT 1";

        const queryArgs = [
            this.name,
            this.parentList.id ? this.parentList.id : -1,
        ];

        try {
            const queryResult = (await connection.query(queryStatement, queryArgs))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check for listColumnType duplicate: ${error.message}`);
        }
    }

    async #createListColumnType(connection) {
        return await existingOrNewConnection(connection, this.#_createListColumnType.bind(this));
    }

    async #_createListColumnType(connection) {
        const queryStatement = "INSERT INTO listColumnsType(ListID, Name, Type) VALUES " + 
            "(?, ?, ?)";

        const queryArgs = [
            this.parentList.id,
            this.name,
            toJSON(this.type),
        ];

        try {
            const queryResult = await connection.query(queryStatement, queryArgs);

            this.id = queryResult.insertId;

            if (!this.id || !bigint.isValid(this.id)) {
                throw new Error("Invalid ID");
            }
        } catch (error) {
            throw new SqlError(`Failed to insert a listColumnsType: ${error.message}`);
        }
    }

    async #updateListColumnType(connection) {
        return await existingOrNewConnection(connection, this.#_updateListColumnType.bind(this));
    }

    async #_updateListColumnType(connection) {
        let queryStatement = 
            "UPDATE listColumnsType SET Name = ? " +
            "WHERE ListColumnTypeID = ?";

        const queryArgs = [
            this.name,
            this.id,
        ];

        try {
            const result = await connection.query(queryStatement, queryArgs);

            if (result.affectedRows === 0) {
                throw new SqlError("Invalid List Column ID");
            }
        } catch (error) {
            throw new SqlError(`Failed to update item: ${error.message}`);
        }
    }

    static async findByID(id, connection) {
        id = bigint.toBigInt(id);

        if (!bigint.isValid(id)) {
            return null; 
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT ListID, ListColumnTypeID, Name, Type " +
                "FROM listColumnsType WHERE ListColumnTypeID = ?";

            const queryArgs = [
                id
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (!queryResult.length) {
                    return null;
                }
                
                const foundList = await List.findByID(queryResult[0].ListID, connection);
                if (!foundList.isValid()) {
                    throw new Error("Failed to retrieve parent list");
                }

                const foundColumnType = new ListColumnType(queryResult[0].Name, queryResult[0].Type, foundList);
                foundColumnType.id = queryResult[0].ListColumnTypeID;

                if (!foundColumnType.isValid()) {
                    return null;
                }

                return foundColumnType;
            } catch (error) {
                throw new SqlError(`Failed to get column type from ID: ${error.message}`);
            }
        });
    }

    static async findFromName(name, list, connection) {
        if (typeof name !== "string" || !name.length ||
            !list || !list instanceof List || !list.isValid()) {
            throw new ValueError(400, "Invalid name or list");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT ListColumnTypeID, Name, Type FROM listColumnsType WHERE Name = ? AND ListID = ?";

            const queryArgs = [
                name,
                list.id,
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (!queryResult.length) {
                    return null;
                }

                const foundColumnType = new ListColumnType(queryResult[0].Name, queryResult[0].Type, list);
                foundColumnType.id = queryResult[0].ListColumnTypeID;

                if (!foundColumnType.isValid()) {
                    return null
                }

                return foundColumnType;
            } catch (error) {
                throw new SqlError(`Failed to get column type by name: ${error.message}`);
            }
        });
    }

    static async findFromList(list, connection) {
        if (!list || !list instanceof List || !list.isValid()) {
            throw new ValueError(400, "Invalid list");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT ListColumnTypeID, Name, Type FROM listColumnsType WHERE ListID = ?;";

            const queryArgs = [
                list.id
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (!queryResult.length) {
                    return [];
                }

                return ListColumnType.#parseFoundColumnsType(list, queryResult);
            } catch (error) {
                throw new SqlError(`Failed to get all lists: ${error.message}`);
            }
        });
    }

    static async findFromUserData(userDataID, connection) {
        userDataID = bigint.toBigInt(userDataID);
        if (!bigint.isValid(userDataID)) {
            throw new InternalError("Invalid User Data ID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                "SELECT l.ListColumnTypeID AS ListColumnTypeID, l.Name AS Name, l.Type AS Type " +
                "FROM listColumnsType l " +
                "INNER JOIN customRowsItems USING (ListColumnTypeID) " +
                "WHERE CustomRowItemsID = ?";

            const queryArgs = [
                userDataID
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (!queryResult.length) {
                    return [];
                }

                return queryResult[0];
            } catch (error) {
                throw new SqlError(`Failed to get column type from user data id: ${error.message}`);
            }
        });
    }

    static async deleteFromList(listID, connection) {
        listID = bigint.toBigInt(listID);
        if (!bigint.isValid(listID)) {
            throw new InternalError("Invalid List ID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `DELETE FROM listColumnsType WHERE ListID = ?`;

            const queryArgs = [
                listID
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);
            } catch (error) {
                throw new SqlError(`Failed to delete columns type from list id: ${error.message}`);
            }
        });
    }

    static async deleteFromID(customListID, connection) {
        customListID = bigint.toBigInt(customListID);
        if (!bigint.isValid(customListID)) {
            throw new InternalError("Invalid List Columns Type ID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                `DELETE FROM listColumnsType WHERE ListColumnTypeID = ${customListID}`;

            const queryArgs = [
                customListID
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (queryResult.affectedRows === 0) {
                    throw new ValueError(400, "Invalid List");
                }
            } catch (error) {
                throw new SqlError(`Failed to delete custom column ${customListID}: ${error.message}`);
            }
        });
    }

    static async getCount(listID, connection) {
        if (!bigint.isValid(listID)) {
            throw new ValueError(400, "Invalid List");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `SELECT COUNT(*) AS count FROM listColumnsType WHERE ListID = ${listID}`;

            const queryArgs = [
                listID
            ];

            try {
                const queryResult = (await connection.query(queryStatement, queryArgs))[0];

                return queryResult.count;
            } catch (error) {
                throw new SqlError(`Failed to query number of customs columns: ${error.message}`);
            }
        });
    }

    static async getCountFromUser(userID, connection) {
        if (!bigint.isValid(userID)) {
            throw new ValueError(400, "Invalid User");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                `
                SELECT COUNT(*) AS count FROM listColumnsType lt
                INNER JOIN lists l USING (ListID)
                INNER JOIN collections c USING (CollectionID)
                WHERE c.UserID = ?`;
            
            const queryArgs = [
                userID,
            ];

            try {
                const queryResult = (await connection.query(
                    queryStatement,
                    queryArgs,
                ))[0];

                return queryResult.count;
            } catch (error) {
                throw new SqlError(`Failed to query the number of custom columns from user: ${error.message}`);
            }
        });
    }

    static #parseFoundColumnsType(list, columnsType) {
        const columnTypeArray = [];

        for (let item of columnsType) {
            const columnType = new ListColumnType(item.Name, item.Type, list);
            columnType.id = item.ListColumnTypeID;

            if (columnType.isValid()) {
                columnTypeArray.push(columnType);
            } 
        }
        
        return columnTypeArray;
    }
}

module.exports = {
    ListColumnType
}
