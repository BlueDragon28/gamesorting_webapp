const bigint = require("../utils/numbers/bigint");
const { List } = require("./lists");
const { ListSorting, isValidListSorting } = require("./listSorting");
const { CustomRowsItems } = require("./customUserData");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { existingOrNewConnection } = require("../utils/sql/sql");
const Pagination = require("../utils/sql/pagination");

function addSearchOptions(searchOptions, queryArgs) {
    if (!searchOptions || typeof searchOptions.exactMatch !== "boolean" ||
            typeof searchOptions.regex !== "boolean" ||
            typeof searchOptions.text !== "string" || !searchOptions.text.length) {
        
        return "";
    }

    let searchStatement;

    const { exactMatch, regex, text } = searchOptions;

    if (exactMatch) {
        searchStatement = " AND Name = ?";
        queryArgs.push(text);
    } else if (regex) {
        searchStatement = " AND Name RLIKE ?";
        queryArgs.push(text);
    } else {
        searchStatement = " AND Name LIKE ?";
        queryArgs.push(`%${text}%`);
    }

    return searchStatement;
}

function applyListSorting(listSorting) {
    let queryStatement = "";
    const reverseSqlValue = isValidListSorting(listSorting) ?
        (listSorting.reverseOrder === true ? "DESC" : "ASC") :"ASC";

    if (isValidListSorting(listSorting) && listSorting.type === "order-by-name") {
        queryStatement += `Name ${reverseSqlValue} `;
    } else if (isValidListSorting(listSorting) && listSorting.type === "order-by-rating") {
        queryStatement += `Rating ${reverseSqlValue} `;
    } else {
        queryStatement += `ItemID ${reverseSqlValue} `;
    }

    return queryStatement;
}

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

    async delete(connection) {
        if (!this.id) return;
        return await Item.deleteFromID(this.id, connection);
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
            url: this.url,
            rating: this.rating,
            customData: this.customData ? this.customData.map(item => item.toBaseObject()) : null,
            parentListID: this.parentList.id
        };
    }

    async #_exists(connection) {
        if (!this.isValid()) {
            return false;
        }

        const queryStatement = "SELECT COUNT(1) AS count FROM items WHERE ItemID = ?";

        const queryArgs = [
            this.id
        ];

        try {
            const queryResult = (await connection.query(queryStatement, queryArgs))[0];

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
            "VALUES (?, ? " +
            ` ${this.url.length > 0 ? ", ?": ""}` + 
            ` ${this.rating > 0 ? ", ?" : ""})`;

        const queryArgs = [
            this.parentList.id,
            this.name,
        ];

        if (this.url.length > 0) {
            queryArgs.push(this.url);
        }

        if (this.rating > 0) {
            queryArgs.push(this.rating);
        }

        try {
            const queryResult = await connection.query(queryStatement, queryArgs);

            this.id = queryResult.insertId;

            if (!this.id || !bigint.isValid(this.id)) {
                throw new Error("Invalid ID");
            }
        } catch (error) {
            console.log(error);
            throw new SqlError(`Failed to insert a item: ${error.message}`);
        }
    }

    async #updateItem(connection) {
        return await existingOrNewConnection(connection, this.#_updateItem.bind(this));
    }

    async #_updateItem(connection) {
        let queryStatement = 
            "UPDATE items SET Name = ?, Rating = ?";

        const queryArgs = [
            this.name,
            this.rating,
        ];

        if (typeof this.url === "string") {
            queryStatement += ", URL = ? ";
            queryArgs.push(this.url);
        }

        queryStatement += "WHERE ItemID = ?";
        queryArgs.push(this.id);

        try {
            const result = await connection.query(queryStatement, queryArgs);
        } catch (error) {
            throw new SqlError(`Failed to update item: ${error.message}`);
        }
    }

    async #_isDuplicate(connection) {
        const queryStatement = 
            "SELECT COUNT(1) as count FROM items " +
            "WHERE Name = ? AND ItemID != ? " +
            "AND ListID = ? " +
            "LIMIT 1";

        const queryArgs = [
            this.name,
            this.id ? this.id : -1,
            this.parentList.id,
        ];

        try {
            const queryResult = (await connection.query(queryStatement, queryArgs))[0];

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
                "WHERE ItemID = ?";

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

    static async findFromList(list, pageNumber = 0, listSorting = null, connection, searchOptions = null) {
        if (!list || !list instanceof List || !list.isValid() ||
                typeof pageNumber !== "number" || pageNumber < 0) {
            throw new ValueError(400, "Invalid List");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const foundListSorting = listSorting instanceof ListSorting ?
                listSorting :
                await ListSorting.findByList(list, connection);

            // If page number if to high, set it to 1
            const [isValidPageNumber, numberOfItems] = await Item.isValidPageNumber(list, pageNumber, connection, searchOptions)
            const validPageNumber = isValidPageNumber ? pageNumber : 1;

            const pagination = new Pagination(validPageNumber, numberOfItems, 
                foundListSorting instanceof ListSorting ? foundListSorting.reverseOrder : false);
            if (!pagination.isValid) {
                throw new ValueError(400, "Invalid page number");
            }

            const queryArgs = [
                list.id,
            ]

            let queryStatement = 
                "SELECT ItemID, Name, URL, Rating FROM items WHERE ListID = ? " + 
                addSearchOptions(searchOptions, queryArgs) + 
                " ORDER BY " +
                applyListSorting(foundListSorting);

            if (pageNumber !== 0) {
                queryStatement += "LIMIT ? OFFSET ? ";

                queryArgs.push(
                    Pagination.ITEM_PER_PAGES,
                    Pagination.calcOffset(validPageNumber),
                );
            }

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (!queryResult.length) {
                    return [[], pagination];
                }

                return [Item.#parseFoundItems(list, queryResult), pagination];
            } catch (error) {
                throw new SqlError(`Failed to get all lists: ${error.message}`);
            }
        });
    }

    static async findFromName(name, list, connection) {
        if (typeof name !== "string") {
            return null;
        }

        const trimmedName = name.trim();

        if (!trimmedName.length || 
                !list || !list instanceof List || !list.isValid()) {

            return null;
        }

        return existingOrNewConnection(connection, async function(connection) {
            const queryString = 
                "SELECT ListID, ItemID, Name, URL, Rating " +
                "FROM items " +
                "WHERE Name = ? AND ListID = ?";

            const queryArgs = [
                name, 
                list.id,
            ];

            try {
                const queryResult = await connection.query(queryString, queryArgs);
                if (!queryResult.length) {
                    return null
                }
                const foundItem = queryResult[0];
                const item = new Item(foundItem.Name, foundItem.URL, list);
                item.rating = foundItem.Rating;
                item.id = foundItem.ItemID;

                const foundCustomData = await CustomRowsItems.findFromItem(item.id, connection);
                item.customData = foundCustomData;

                return item;
            } catch (error) {
                throw new SqlError(`Failed to get item from name ${error.message}`);
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
                "DELETE FROM items WHERE ItemID = ?";

            const queryArgs = [
                id
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

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
                "INNER JOIN users USING (UserID) WHERE UserID = ? AND ItemID = ?";

            const queryArgs = [
                userID, 
                itemID,
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                return queryResult[0].count > 0;
            } catch (error) {
                throw new SqlError(`Failed to check if user is allowed to view this item`);
            }
        });
    }

    static async getCount(list, connection, searchOptions = null) {
        if (!list.isValid()) {
            throw new ValueError(400, "Invalid list");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryArgs = [
                list.id,
            ];

            const queryStatement =
                "SELECT COUNT(*) AS count FROM items " +
                "WHERE ListID = ?" + addSearchOptions(searchOptions, queryArgs);

            try {
                const queryResult = (await connection.query(queryStatement, queryArgs))[0];

                return queryResult.count;
            } catch (error) {
                throw new SqlError(`Failed to query number of items in lists: ${error.message}`);
            }
        });
    }

    static async isValidPageNumber(list, pageNumber, connection, searchOptions = null) {
        if (!list.isValid()) {
            throw new ValueError(400, "Invalid list");
        }

        if (typeof pageNumber !== "number" && pageNumber < 0) {
            throw new ValueError(400, "Invalid page number");
        }

        const itemCount = await Item.getCount(list, connection, searchOptions);
        const numberOfPages = Math.ceil(Number(itemCount) / Pagination.ITEM_PER_PAGES);

        return [pageNumber <= numberOfPages, itemCount];
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
