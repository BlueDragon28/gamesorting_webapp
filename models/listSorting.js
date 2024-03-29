const bigint = require("../utils/numbers/bigint");
const { List } = require("./lists");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { existingOrNewConnection } = require("../utils/sql/sql");


class ListSorting {
    id;
    type;
    parentList;
    reverseOrder;

    constructor(type, parentList, reverseOrder = null) {
        if (typeof type === "string") {
            this.type = type;
        }

        if (parentList instanceof List) {
            this.parentList = parentList;
        }

        if (typeof reverseOrder === "boolean") {
            this.reverseOrder = reverseOrder;
        } else if (typeof reverseOrder === "number") {
            this.reverseOrder = reverseOrder !== 0;
        } else {
            this.reverseOrder = null;
        }
    }

    isValid() {
        this.id = this.id !== undefined ? bigint.toBigInt(this.id) : undefined;
        this.type = typeof this.type === "string" ? this.type.trim() : undefined;

        if ((this.is !== undefined && !bigint.isValid(this.id)) ||
            typeof this.type !== "string" || !this.type?.length ||
            !this.parentList instanceof List || !this.parentList?.isValid() ||
            (this.reverseOrder !== null && typeof this.reverseOrder !== "boolean")) {

            return false;
        }

        return true;
    }

    async save(connection) {
        const isItemExisting = await this.exists(connection);

        if (!this.isValid(connection) ||
            !bigint.isValid(this.parentList.id)) {

            throw new ValueError(400, "Invalid sorting option");
        }

        if (!isItemExisting) {
            await this.#createItem(connection);
        } else {
            await this.#updateItem(connection);
        }
    }

    async delete(connection) {
        return ListSorting.deleteFromList(this.parentList, connection);
    }

    async exists(connection) {
        return existingOrNewConnection(connection, this.#_exists.bind(this));
    }

    async #_exists(connection) {
        if (this.id) {
            return true;
        }

        const queryStatement =
            "SELECT ListSortingID FROM listSorting WHERE ListID = ?";

        const queryArgs = [
            this.parentList.id
        ];

        try {
            const queryResult = await connection.query(queryStatement, queryArgs);
            const isExisting = queryResult.length > 0;

            if (isExisting) {
                this.id = queryResult[0].ListSortingID;
            }

            return isExisting;
        } catch (error) {
            throw new SqlError(`Failed to check if listSorting exists: ${error.message}`);
        }
    }

    async #createItem(connection) {
        return await existingOrNewConnection(connection, this.#_createItem.bind(this));
    }

    async #_createItem(connection) {
        const queryStatement =
            `INSERT INTO listSorting(ListID, Type ${typeof this.reverseOrder === "boolean" ? ", ReverseOrder" : ""}) ` +
            `VALUES (?, ? ${typeof this.reverseOrder === "boolean" ? ", ?" : ""})`;

        const queryArgs = [
            this.parentList.id,
            this.type,
        ];

        if (typeof this.reverseOrder === "boolean") {
            queryArgs.push(this.reverseOrder);
        }

        try {
            const queryResult = await connection.query(queryStatement, queryArgs);

            this.id = queryResult.insertId;

            if (!this.id || !bigint.isValid(this.id)) {
                throw new Error("Invalid ID");
            }
        } catch (error) {
            throw new SqlError(`Failed to insert new listSortingOption: ${error.message}`);
        }
    }

    async #updateItem(connection) {
        return await existingOrNewConnection(connection, this.#_updateItem.bind(this));
    }

    async #_updateItem(connection) {
        let queryStatement =
            "UPDATE listSorting SET Type = ? " +
            `${typeof this.reverseOrder === "boolean" ? `, ReverseOrder = ?` : ""} ` +
            "WHERE ListSortingID = ?";

        const queryArgs = [
            this.type,
        ];

        if (typeof this.reverseOrder === "boolean") {
            queryArgs.push(this.reverseOrder);
        }
        queryArgs.push(this.id);

        try {
            const queryResult = await connection.query(queryStatement, queryArgs);
        } catch (error) {
            throw new SqlError(`Failed to update list sorting element: ${error.message}`);
        }
    }

    static async findByList(list, connection) {
        if (!list || !list instanceof List || !list.isValid()) {
            throw new ValueError(400, "Invalid List");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT ListSortingID, ListID, ReverseOrder, Type FROM listSorting " +
                "WHERE ListID = ?";

            const queryArgs = [
                list.id
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (!queryResult.length) {
                    return null;
                }

                return ListSorting.#parseFoundItem(list, queryResult[0]);
            } catch (error) {
                throw new SqlError(`Failed to get list sorting option from list id: ${error.message}`);
            }
        });
    }

    static async deleteFromList(list, connection) {
        if (!list || !list instanceof List || !list.isValid()) {
            throw new ValueError(400, "Invalid List");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "DELETE FROM listSorting WHERE ListID = ?";

            const queryArgs = [
                list.id
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                return queryResult.affectedRows;
            } catch (error) {
                throw new SqlError(`Failed to delete list sorting item from list: ${error.message}`);
            }
        });
    }

    static async getCountFromList(list, connection) {
        if (!list || !list instanceof List || !list.isValid()) {
            throw new ValueError(400, "Invalid List");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                "SELECT COUNT(*) AS count FROM listSorting WHERE ListID = ?";

            const queryArgs = [
                list.id
            ];

            try {
                const queryResult = (await connection.query(queryStatement, queryArgs))[0];

                return queryResult?.count;
            } catch (error) {
                throw new SqlError(`Failed to get listSorting count from list: ${error.message}`);
            }
        });
    }

    static async #parseFoundItem(list, result) {
        if (!result) {
            return null;
        }

        const listSorting = new ListSorting(result.Type, list, result.ReverseOrder);
        listSorting.id = result.ListSortingID;

        if (!listSorting.isValid()) {
            return null;
        }

        return listSorting;
    }
}

function isValidListSorting(listSorting) { 
    return listSorting instanceof ListSorting && listSorting.isValid(); 
}

module.exports = {
    ListSorting,
    isValidListSorting
};
