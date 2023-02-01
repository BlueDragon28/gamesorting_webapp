const bigint = require("../utils/numbers/bigint");
const { List } = require("./lists");
const { CustomRowsItems } = require("./customUserData");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { sqlString, existingOrNewConnection } = require("../utils/sql/sql");

//function strRetrieveItemsFromList(collectionID, listID, itemID) {
    //collectionID = bigint.toBigInt(collectionID);
    //listID = bigint.toBigInt(listID);

    //if (itemID) {
        //itemID = bigint.toBigInt(itemID);
    //}

    //if (!bigint.isValid(collectionID) || !bigint.isValid(listID) || (itemID && !bigint.isValid(itemID))) {
        //throw new ValueError(400, "Invalid Collection ID or List ID or Item ID");
    //}

    //let strStatement = 
        //"SELECT ItemID, i.Name AS Name, URL FROM items i " + 
        //"INNER JOIN lists l ON i.ListID = l.ListID " + 
        //"INNER JOIN collections c ON l.CollectionID = c.CollectionID " +
        //`WHERE i.ListID = ${listID} AND c.CollectionID = ${collectionID}`;
    
    //if (itemID) {
        //strStatement += ` AND i.ItemID = ${itemID}`;
    //}

    //return strStatement;
//}

//function strAddNewItem(collectionID, listID, itemData) {
    //collectionID = bigint.toBigInt(collectionID);
    //listID = bigint.toBigInt(listID);

    //if (!bigint.isValid(collectionID) || !bigint.isValid(listID) || 
        //typeof itemData !== "object" || !itemData.name || itemData.name.trim().length === 0) {
        //throw new ValueError(400, "Invalid Collection ID or List ID or Item Name");
    //}

    //return `INSERT INTO items(ListID, Name ${itemData.url ? ", Url":""}) ` +
           //`VALUES (${listID}, "${itemData.name.trim()}" ${itemData.url ? ", \"" + itemData.url + "\"":""})`;
//}

//function strEditItem(itemData) {
    //const itemID = bigint.toBigInt(itemData.ItemID);
    //const { Name, URL } = itemData;

    //if (!bigint.isValid(itemID) || !Name || Name.trim().length === 0) {
        //throw new ValueError(400, "Invalid Item Data");
    //}

    //return `UPDATE items SET Name = "${Name.trim()}", URL = ${URL ? '"' + URL + '"' : "NULL"} WHERE ItemID = ${itemID}`;
//}

//function strDeleteItem(collectionID, listID, itemID) {
    //collectionID = bigint.toBigInt(collectionID);
    //listID = bigint.toBigInt(listID);
    //itemID = bigint.toBigInt(itemID);

    //if (!bigint.isValid(collectionID) || !bigint.isValid(listID) || !bigint.isValid(itemID)) {
        //throw new ValueError(400, "Invalid Collection ID or List ID or Item ID");
    //}

    //return "DELETE FROM items " +
           //`WHERE items.ItemID = ${itemID} AND items.ListID = ${listID}`;
//}

//function strDeleteAllItemsFromList(collectionID, listID) {
    //collectionID = bigint.toBigInt(collectionID);
    //listID = bigint.toBigInt(listID);

    //if (!bigint.isValid(collectionID) || !bigint.isValid(listID)) {
        //throw new ValueError(400, "Invalid Collection ID or List ID");
    //}

    //return "DELETE FROM items " +
           //`WHERE items.ListID = ${listID}`
//}

//function strCheckIfItemExists(collectionID, listID, itemID) {
    //collectionID = bigint.toBigInt(collectionID);
    //listID = bigint.toBigInt(listID);
    //itemID = bigint.toBigInt(itemID);

    //if (!collectionID || !listID || !itemID) {
        //throw new ValueError(400, "Invalid Collection ID or List ID or Item ID");
    //}

    //return "SELECT COUNT(i.ItemID) AS count FROM items i " +
           //"INNER JOIN lists l ON i.ListID = i.ListID " +
           //"INNER JOIN collections c ON l.CollectionID = c.CollectionID " +
           //`WHERE i.ItemID = ${itemID} AND l.ListID = ${listID} AND c.CollectionID = ${collectionID}`;
//}

//[>
//Checking if an item exists and is part of a specific list and collection.
//*/
//async function checkIfItemExists(connection, collectionID, listID, itemID) {
    //const strStatement = strCheckIfItemExists(collectionID, listID, itemID);

    //if (!connection || !strStatement) {
        //throw new SqlError("Failed to prepare statement");
    //}

    //try {
        //const queryResult = await connection.query(strStatement);

        //if (queryResult[0].count > 0) {
            //return true;
        //}
    //} catch (error) {
        //throw new SqlError(`Failed to check if item ${itemID} already exists: ${error.message}`);
    //}

    //return false;
//}

//[>
//Deleting all the custom data from a bunch of items
//*/
//async function deleteCustomDatas(connection, collectionID, listID, itemID) {
    //collectionID = bigint.toBigInt(collectionID);
    //listID = bigint.toBigInt(listID);
    //itemID = bigint.toBigInt(itemID);

    //if (!connection || !bigint.isValid(collectionID) || !bigint.isValid(listID) || (itemID && !bigint.isValid(itemID))) {
        //throw new ValueError(400, "Invalid Informations");
    //}

    //if (bigint.isValid(itemID)) {
        //await customUserData.delete(connection, itemID);
        //return;
    //}

    //let items;
    //try {
        //items = await connection.query(
            //"SELECT ItemID FROM items i " + 
            //"INNER JOIN lists l ON i.ListID = l.ListID " + 
            //"INNER JOIN collections c ON l.CollectionID = c.CollectionID " +
            //`WHERE i.ListID = ${listID} AND c.CollectionID = ${collectionID}`);
    //} catch (error) {
        //throw new SqlError(`Failed to query items: ${error.message}`);
    //}

    //if (!items) {
        //throw new InternalError("Invalid Items List");
    //}

    //for (let item of items) {
        //await customUserData.delete(connection, item.ItemID);
    //}
//}

//module.exports = {
    //exists: checkIfItemExists,

    //[>
    //Return the items inside a list
    //*/
    //find: async function(connection, collectionID, listID, itemID) {
        //const strStatement = strRetrieveItemsFromList(collectionID, listID, itemID);

        //if (!connection || !strStatement) {
            //throw new SqlError("Failed to prepare statement");
        //}

        //let queryResult = null;
        //try {
            //queryResult = await connection.query(strStatement);

            //if (itemID) {
                //queryResult = queryResult[0];
            //}
        //} catch (error) {
            //throw new SqlError(`Failed to find item ${itemID}: ${error.message}`);
        //}

        //return queryResult;
    //},

    //[>
    //Insert a new item into a list
    //*/
    //new: async function(connection, itemData) {
        //const strStatement = strAddNewItem(
            //itemData.parent.collection.CollectionID, 
            //itemData.parent.list.ListID, 
            //itemData.data);

        //if (!connection || !strStatement) {
            //throw new SqlError("Failed to prepare statement");
        //}

        //let itemID;
        //try {
            //const queryResult = await connection.query(strStatement);
            //itemID = queryResult.insertId;
        //} catch (error) {
            //throw new SqlError(`Failed to insert a new item ${error.message}`);
        //}

        //if (typeof itemID !== "bigint" || itemID <= 0) {
            //itemID = null;
        //}

        //if (itemID && itemData.data.customData) {
            //await customUserData.insert(connection, itemID, itemData.data.customData);
        //}

        //return itemID;
    //},  

    //[>
    //Edit an item
    //*/
    //edit: async function(connection, itemData) {
        //const strStatement = strEditItem(itemData.data);

        //if (!connection || !strStatement) {
            //throw new SqlError("Failed to prepare statement");
        //}

        //try {
            //queryResult = await connection.query(strStatement);
        //} catch (error) {
            //throw new SqlError(`Failed to edit an item ${error.message}`);
        //}

        //await customUserData.edit(connection, itemData);

        //return true;
    //},

    //[>
    //Delete an item from a list
    //*/
    //delete: async function(connection, collectionID, listID, itemID) {
        //let strStatement;
        //if (collectionID && listID && itemID) {
            //strStatement = strDeleteItem(collectionID, listID, itemID);
        //} else if (collectionID && listID) {
            //strStatement = strDeleteAllItemsFromList(collectionID, listID);
        //}

        //if (!connection || !strStatement) {
            //throw new SqlError("Failed to prepare statement");
        //}

        //// Delete all custom data from itemID or listID
        //deleteCustomDatas(connection, collectionID, listID, itemID);

        //try {
            //await connection.query(strStatement);
        //} catch (error) {
            //throw new SqlError(`Failed to delete the item ${itemID}: ${error.message}`);
        //}

        //return true;
    //}
//};

class Item {
    id;
    name;
    url;
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
        this.id = this.id ? bigint.toBigInt(this.id) : undefined;
        this.name = this.name.trim();
        if (this.url && typeof this.url === "string") {
            this.url = this.url.trim();
        }
        
        if ((this.id && !bigint.isValid(this.id)) ||
            !this.name || typeof this.name !== "string" || !this.name.length ||
            !this.parentList || !this.parentList instanceof List ||
            !this.parentList.isValid()) {
            return false;
        }

        return true;
    }

    async save(connection) {
        const isItemExisting = await this.exists(connection);

        if (!this.isValid(connection)) {
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
        const queryStatement = `INSERT INTO items(ListID, Name ${this.url.length > 0 ? ", URL" : ""}) ` +
            `VALUES (${this.parentList.id}, "${sqlString(this.name)}" ` +
            ` ${this.url.length > 0 ? ", " + sqlString(this.url): ""})`;

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
        const queryStatement = 
            `UPDATE items SET Name = "${sqlString(this.name)}" WHERE ListID = ${this.id} `;

        if (this.url > 0) {
            queryStatement += `, URL = ${sqlString(this.url)}`;
        }

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
                "SELECT l.ListID AS ListID, i.ItemID AS ItemID, i.Name AS Name, i.URL AS URL " + 
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

    static async findFromList(list, connection) {
        if (!list || !list instanceof List || !list.isValid()) {
            throw new ValueError(400, "Invalid List");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `SELECT ItemID, Name, URL FROM items WHERE ListID = ${list.id};`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return [];
                }

                return Item.#parseFoundItems(list, queryResult);
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
            } catch (error) {
                throw new SqlError(`Failed to delete list ${id}: ${error.message}`);
            }
        });
    }

    static #parseFoundItems(list, items) {
        const itemsArray = [];

        for (let item of items) {
            const newItem = new Item(item.Name, item.URL, list);
            newItem.id = item.ItemID;

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
