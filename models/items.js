const bigint = require("../utils/numbers/bigint");
const { List } = require("./lists");
const { CustomRowsItems } = require("./customUserData");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { sqlString, existingOrNewConnection } = require("../utils/sql/sql");
const Pagination = require("../utils/sql/pagination");

class Item {
    id;
    name;
    url;
    rating = 0;
    parentList;
    customData;

    constructor(name, url, parentList, customData) {
        if (name && typeof name === "string") {
            this.name = name;
        }

        if (url && typeof url === "string") {
            this.url = url;
        } else {
            this.url = "";
        }

        if (parentList && parentList instanceof List) {
            this.parentList = parentList
        }

        if (customData && Array.isArray(customData)) {
            this.customData = customData;
        }
    }

    isValid() {
        this.id = this.id !== undefined ? bigint.toBigInt(this.id) : undefined;
        this.name = typeof this.name === "string" ? this.name.trim() : undefined;
        if (this.url && typeof this.url === "string") {
            this.url = this.url.trim();
        } else {
            this.url = "";
        }

        if (typeof this.rating === "string") {
            this.rating = Number(this.rating);
        } else if (typeof this.rating !== "number") {
            this.rating = 0;
        }
        
        if ((this.id !== undefined && !bigint.isValid(this.id)) ||
            !this.name || typeof this.name !== "string" || !this.name.length ||
            !this.parentList || !this.parentList instanceof List ||
            !this.parentList.isValid()) {
            return false;
        }

        return true;
    }

    async save(connection) {
        const isItemExisting = await this.exists(connection);

        if (!this.isValid(connection) ||
            !bigint.isValid(this.parentList.id)) {
            throw new ValueError(400, "Invalid Item Name");
        }

        if (await this.isDuplicate(connection)) {
            throw new ValueError(400, "Item Name Is Already Used");
        }

        if (!isItemExisting) {
            await this.#createItem(connection);
        } else {
            await this.#updateItem(connection);
        }
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

    async #_exists(connection) {
        if (!this.isValid()) {
            return false;
        }

        const queryStatement = `SELECT COUNT(1) AS count FROM items WHERE ItemID = ${this.id}`

        try {
            const queryResult = (await connection.query(queryStatement))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check if item exists: ${error.message}`);
        }
    }

    async #createItem(connection) {
        return await existingOrNewConnection(connection, this.#_createItem.bind(this));
    }

    async #_createItem(connection) {
        const queryStatement = `INSERT INTO items(ListID, Name ${this.url.length > 0 ? ", URL" : ""} ${this.rating > 0 ? ", Rating" : ""}) ` +
            `VALUES (${this.parentList.id}, "${sqlString(this.name)}" ` +
            ` ${this.url.length > 0 ? ", \"" + sqlString(this.url) + "\"": ""}` + 
            ` ${this.rating > 0 ? ", " + this.rating: ""})`;

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

    async #updateItem(connection) {
        return await existingOrNewConnection(connection, this.#_updateItem.bind(this));
    }

    async #_updateItem(connection) {
        let queryStatement = 
            `UPDATE items SET Name = "${sqlString(this.name)}", Rating = ${this.rating}`;

        if (typeof this.url === "string") {
            queryStatement += `, URL = \"${sqlString(this.url)}\" `;
        }

        queryStatement += `WHERE ItemID = ${this.id}`;

        try {
            const result = await connection.query(queryStatement);
        } catch (error) {
            throw new SqlError(`Failed to update item: ${error.message}`);
        }
    }

    async #_isDuplicate(connection) {
        const queryStatement = 
            "SELECT COUNT(1) as count FROM items " +
            `WHERE Name = "${sqlString(this.name)}" AND ItemID != ${this.id ? this.id : -1} ` +
            `AND ListID = ${this.parentList.id} ` +
            "LIMIT 1";

        try {
            const queryResult = (await connection.query(queryStatement))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check for item duplicate: ${error.message}`);
        }
    }

    static async findByID(id, connection) {
        id = bigint.toBigInt(id);

        if (!bigint.isValid(id)) {
            return null; 
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT l.ListID AS ListID, i.ItemID AS ItemID, i.Name AS Name, i.URL AS URL, i.Rating AS Rating " + 
                "FROM items i " +
                "INNER JOIN lists l USING (ListID) " +
                `WHERE ItemID = ${id}`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return null;
                }
                
                const foundList = await List.findByID(queryResult[0].ListID, connection);
                if (!foundList.isValid()) {
                    throw new Error("Failed to retrieve parent list");
                }

                const foundItem = new Item(queryResult[0].Name, queryResult[0].URL, foundList);
                foundItem.id = queryResult[0].ItemID;
                foundItem.rating = queryResult[0].Rating;

                if (!foundItem.isValid()) {
                    return null;
                }

                const foundCustomData = await CustomRowsItems.findFromItem(foundItem.id, connection);
                foundItem.customData = foundCustomData;

                return foundItem;
            } catch (error) {
                throw new SqlError(`Failed to get item from ID: ${error.message}`);
            }
        });
    }

    static async findFromList(list, pageNumber = 0, reverse = false, connection) {
        if (!list || !list instanceof List || !list.isValid() ||
                typeof pageNumber !== "number" || pageNumber < 0) {
            throw new ValueError(400, "Invalid List");
        }

        if (reverse !== true && reverse !== false) throw new ValueError(400, "Invalid reverse value!");

        return await existingOrNewConnection(connection, async function(connection) {
            const numberOfItems = await Item.getCount(list, connection);

            // If page number if to high, set it to 1
            const validPageNumber = await Item.isValidPageNumber(list, pageNumber, connection) ?
                pageNumber : 1;

            const pagination = new Pagination(validPageNumber, numberOfItems, reverse);
            if (!pagination.isValid) {
                throw new ValueError(400, "Invalid page number");
            }

            let queryStatement = 
                `SELECT ItemID, Name, URL, Rating FROM items WHERE ListID = ${list.id} ORDER BY ItemID ${reverse === true ? "DESC" : "ASC"} `;

            if (pageNumber !== 0) {
                queryStatement += `LIMIT ${Pagination.ITEM_PER_PAGES} OFFSET ${Pagination.calcOffset(validPageNumber)}`;
            }

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return [[], pagination];
                }

                return [Item.#parseFoundItems(list, queryResult), pagination];
            } catch (error) {
                throw new SqlError(`Failed to get all lists: ${error.message}`);
            }
        });
    }

    static async deleteFromID(id, connection) {
        id = bigint.toBigInt(id);
        if (!bigint.isValid(id)) {
            throw new ValueError(400, "Invalid Item ID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `DELETE FROM items WHERE ItemID = ${id}`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (queryResult.affectedRows === 0) {
                    throw new ValueError(400, "Invalid Item ID");
                }
            } catch (error) {
                throw new SqlError(`Failed to delete list ${id}: ${error.message}`);
            }
        });
    }

    static async isUserAllowed(userID, itemID, connection) {
        userID = bigint.toBigInt(userID);
        itemID = bigint.toBigInt(itemID);

        if (!bigint.isValid(userID) || !bigint.isValid(itemID)) {
            throw new ValueError(400, "Invalid UserID or ItemID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                "SELECT COUNT(*) AS count FROM items INNER JOIN lists USING (ListID) " + 
                "INNER JOIN collections USING (CollectionID) " + 
                `INNER JOIN users USING (UserID) WHERE UserID = ${userID} AND ItemID = ${itemID}`;

            try {
                const queryResult = await connection.query(queryStatement);

                return queryResult[0].count > 0;
            } catch (error) {
                throw new SqlError(`Failed to check if user is allowed to view this item`);
            }
        });
    }

    static async getCount(list, connection) {
        if (!list.isValid()) {
            throw new ValueError(400, "Invalid list");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                "SELECT COUNT(*) AS count FROM items " +
                `WHERE ListID = ${list.id}`;
            
            try {
                const queryResult = (await connection.query(queryStatement))[0];

                return queryResult.count;
            } catch (error) {
                throw new SqlError(`Failed to query number of items in lists: ${error.message}`);
            }
        });
    }

    static async isValidPageNumber(list, pageNumber, connection) {
        if (!list.isValid()) {
            throw new ValueError(400, "Invalid list");
        }

        if (typeof pageNumber !== "number" && pageNumber < 0) {
            throw new ValueError(400, "Invalid page number");
        }

        const itemCount = await Item.getCount(list, connection);
        const numberOfPages = Math.ceil(Number(itemCount) / Pagination.ITEM_PER_PAGES);

        return pageNumber <= numberOfPages;
    }

    static #parseFoundItems(list, items) {
        const itemsArray = [];

        for (let item of items) {
            const newItem = new Item(item.Name, item.URL, list);
            newItem.id = item.ItemID;
            newItem.rating = item.Rating;

            if (newItem.isValid()) {
                itemsArray.push(newItem);
            } 
        }
        
        return itemsArray;
    }
}

module.exports = {
    Item
}
