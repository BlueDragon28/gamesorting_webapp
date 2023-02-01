const bigint = require("../utils/numbers/bigint");
const { List } = require("./lists");
const { SqlError, ValueError, InternalError } = require("../utils/errors/exceptions");
const { sqlString, existingOrNewConnection } = require("../utils/sql/sql");

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
        this.id = this.id ? bigint.toBigInt(this.id) : undefined;
        this.name = this.name.trim();
        
        if ((this.id && !bigint.isValid(this.id)) ||
            !this.name || typeof this.name !== "string" || !this.name.length ||
            !this.type || typeof this.type !== "object" || !this.type.type || typeof this.type.type !== "string" ||
            !this.parentList || !this.parentList instanceof List ||
            !this.parentList.isValid()) {
            return false;
        }

        return true;
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

        const queryStatement = `SELECT COUNT(1) AS count FROM listColumnsType WHERE ListColumnTypeID = ${this.id}`

        try {
            const queryResult = (await connection.query(queryStatement))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check if column type item exists: ${error.message}`);
        }
    }

    static async findByID(id, connection) {
        id = bigint.toBigInt(id);

        if (!bigint.isValid(id)) {
            return null; 
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT l.ListID AS ListID, ct.ListColumnTypeID AS ListColumnTypeID, ct.Name AS Name," +
                "ct.Type AS Type FROM listColumnsType ct INNER JOIN lists l USING (ListID) " +
                `WHERE ListColumnTypeID = ${id}`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return null;
                }
                
                const foundList = await List.findByID(queryResult[0].ListID, connection);
                if (!foundList.isValid()) {
                    throw new Error("Failed to retrieve parent list");
                }

                const foundColumnType = new ListColumnType(queryResult[0].Name, queryResult[0].Type, foundList);
                foundColumnType.id = queryResult[0].ListID;

                if (!foundColumnType.isValid()) {
                    return null;
                }

                return foundColumnType;
            } catch (error) {
                throw new SqlError(`Failed to get column type from ID: ${error.message}`);
            }
        });
    }

    static async findFromList(list, connection) {
        if (!list || !list instanceof List || !list.isValid()) {
            throw new ValueError(400, "Invalid list");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `SELECT ListColumnTypeID, Name, Type FROM listColumnsType WHERE ListID = ${list.id};`;

            try {
                const queryResult = await connection.query(queryStatement);

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
            throw new InternalError(400, "Invalid User Data ID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                "SELECT l.ListColumnTypeID AS ListColumnTypeID, l.Name AS Name, l.Type AS Type " +
                "FROM listColumnsType l " +
                "INNER JOIN customRowsItems USING (ListColumnTypeID) " +
                `WHERE CustomRowItemsID = ${userDataID}`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return [];
                }

                return queryResult[0];
            } catch (error) {
                throw new SqlError(`Failed to get column type from user data id: ${error.message}`);
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
