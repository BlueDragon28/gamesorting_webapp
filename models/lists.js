const bigint = require("../utils/numbers/bigint");
const { Collection } = require("./collections");
//const items = require("./items");
//const customUserData = require("./customUserData");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { sqlString, existingOrNewConnection } = require("../utils/sql/sql");

/*
Statement to query the lists available in a collection
*/
//function strRetrieveListsFromCollection(collectionID, listID) {
    //collectionID = bigint.toBigInt(collectionID);
    //listID = bigint.toBigInt(listID);

    //if (!bigint.isValid(collectionID) || (listID && !bigint.isValid(listID))) {
        //throw new ValueError(400, "Invalid CollectionID or List ID");
    //}

    //let strStatement = "SELECT l.ListID, l.Name FROM lists l " + 
        //"INNER JOIN collections c USING (CollectionID) " +
        //`WHERE c.CollectionID = ${collectionID}`;

    //if (bigint.isValid(listID)) {
        //strStatement += ` AND ListID = ${listID}`;
    //}

    //return strStatement;
//}

//function strRetrieveNameAndIDFromListID(collectionID, listID) {
    //collectionID = bigint.toBigInt(collectionID);
    //listID = bigint.toBigInt(listID);

    //if (!bigint.isValid(collectionID) || !bigint.isValid(listID)) {
        //throw new ValueError(400, "Invalid Collection ID or List ID");
    //}

    //return "SELECT l.ListID, l.Name FROM lists l " + 
        //"INNER JOIN collections c USING (CollectionID) " +
        //`WHERE c.CollectionID = ${collectionID} AND l.ListID = ${listID}`;
//}

//function strCheckIfListExists(collectionID, listID) {
    //collectionID = bigint.toBigInt(collectionID);
    //listID = bigint.toBigInt(listID);

    //if (!bigint.isValid(collectionID) || !bigint.isValid(listID)) {
        //throw new ValueError(400, "Invalid Collection ID or List ID");
    //}

    //return "SELECT COUNT(l.ListID) AS count FROM lists l " +
           //"INNER JOIN collections c USING (CollectionID) " +
           //`WHERE l.ListID = ${listID} AND c.CollectionID = ${collectionID}`;
//}

//function strAddNewList(collectionID, listName) {
    //collectionID = bigint.toBigInt(collectionID);

    //if (!bigint.isValid(collectionID) || (typeof listName !== "string" || listName.trim().length === 0)) {
        //throw new ValueError(400, "Invalid CollectionID or List Name");
    //}

    //return "INSERT INTO lists(CollectionID, Name) " +
           //`VALUES (${collectionID}, "${listName.trim()}")`;
//}

//function strEditList(listID, listName) {
    //listID = bigint.toBigInt(listID);

    //if (!bigint.isValid(listID) || (typeof listName !== "string" || listName.trim().length === 0)) {
        //throw new ValueError(400, "Invalid ListID or Name");
    //}

    //return `UPDATE lists SET Name = "${listName}" WHERE ListID = ${listID}`;
//} 

//function strDeleteList(collectionID, listID) {
    //collectionID = bigint.toBigInt(collectionID);
    //listID = bigint.toBigInt(listID);

    //if (!bigint.isValid(collectionID) || !bigint.isValid(listID)) {
        //throw new ValueError(400, "Invalid Collection ID or List ID");
    //}

    //return `DELETE FROM lists WHERE CollectionID = ${collectionID} AND ListID = ${listID}`;
//}

//function strCheckForDuplicate(collectionID, listName) {
    //collectionID = bigint.toBigInt(collectionID);

    //if (!bigint.isValid(collectionID) || typeof listName !== "string" || listName.trim().length === 0) {
        //throw new ValueError(400, "Invalid Collection ID or List Name");
    //}

    //return "SELECT COUNT(l.ListID) AS count FROM lists l " +
           //"INNER JOIN collections c USING (CollectionID) " +
           //`WHERE l.Name = "${listName.trim()}" AND c.CollectionID = ${collectionID}`;
//}

//async function checkIfListExists(connection, collectionID, listID) {
    //const strStatement = strCheckIfListExists(collectionID, listID);

    //if (!connection || !strStatement) {
        //throw new SqlError("Failed to prepare statement");
    //}

    //try {
        //const queryResult = await connection.query(strStatement);
        //if (queryResult[0].count > 0) {
            //return true;
        //}
    //} catch (error) {
        //throw new SqlError(`Failed to check if list ${listID} exists: ${error.message}`);
    //}

    //return false;
//}

//[>
//Check if a list do not alrady exists
//*/
//async function checkForDuplicate(connection, collectionID, listName) {
    //const strStatement = strCheckForDuplicate(collectionID, listName);

    //if (!connection || !strStatement) {
        //throw new SqlError("Failed to prepare statement");
    //}

    //try {
        //const queryResult = await connection.query(strStatement);

        //if (queryResult[0].count > 0n) {
            //return true;
        //}
    //} catch (error) {
        //throw new SqlError(`Failed to check for duplicate in list: ${error.message}`);
    //}

    //return false;
//}

//module.exports = {
    //[>
    //Check if a list exist and is part of a collection.
    //*/
    //exists: checkIfListExists,

    //[>
    //Returning the lists available inside a collection
    //*/
    //find: async function(connection, collectionID, listID) {
        //const strStatement = strRetrieveListsFromCollection(collectionID, listID);

        //if (!connection || !strStatement) {
            //throw new SqlError("Failed to prepare statement");
        //}

        //let queryResult = null;
        //try {
            //queryResult = await connection.query(strStatement);

            //if (bigint.isValid(listID) && queryResult.length > 0) {
                //queryResult = queryResult[0];
            //}
        //} catch (error) {
            //throw new SqlError(`Failed to find lists: ${error.message}`);
        //}

        //return queryResult;
    //},

    //[>
    //Return the name and id of a list from a ListID
    //*/
    //findNameAndID: async function(connection, collectionID, listID) {
        //const strStatement = strRetrieveNameAndIDFromListID(collectionID, listID);

        //if (!connection || !strStatement) {
            //throw new SqlError("Failed to prepare statement");
        //}

        //let queryResult = null;
        //try {
            //queryResult = await connection.query(strStatement);
        //} catch (error) {
            //throw new SqlError(`Failed to find list name and ID: ${error.message}`);
        //}

        //return queryResult;
    //},

    //[>
    //Add a new list
    //*/
    //new: async function(connection, list) {
        //const strStatement = strAddNewList(
            //list.parent.collection.CollectionID,
            //list.data.Name
        //);

        //if (!connection || !strStatement) {
            //throw new SqlError("Failed to prepare statement");
        //}

        //if (await checkForDuplicate(connection, list.parent.collection.CollectionID, list.data.Name)) {
            //return false;
        //}

        //try {
            //await connection.query(strStatement);
        //} catch (error) {
            //throw new SqlError(`Failed to insert a new list: ${error.message}`);
        //}

        //return true;
    //},

    //[>
    //Edit a list name
    //*/
    //edit: async function(connection, list) {
        //const strStatement = strEditList(list.data.ListID, list.data.Name);
        //const collectionID = bigint.toBigInt(list.parent.collection.CollectionID);

        //if (!connection || !bigint.isValid(collectionID) || !strStatement) {
            //throw new SqlError("Failed to prepare statement");
        //}

        //if (await checkForDuplicate(connection, collectionID, list.data.Name)) {
            //throw new ValueError(400, "Dupplicate name are not allowed");
        //}

        //try {
            //await connection.query(strStatement);
        //} catch (error) {
            //throw new SqlError(`Failed to update list ${list.data.ListID}`)
        //}

        //return true;
    //},

    //[>
    //Delete a list
    //*/
    //delete: async function(connection, collectionID, listID) {
        //const strStatement = strDeleteList(collectionID, listID);

        //if (!connection || !strStatement) {
            //throw new SqlError("Failed to prepare statement");
        //}

        //try {
            //await connection.query(strStatement);
        //} catch (error) {
            //throw new SqlError(`Failed to delete the list ${listID}: ${error.message}`);
        //}

        //await items.delete(connection, collectionID, listID);
        //await customUserData.deleteColumns(connection, listID);

        //return true;
    //}
//}

class List {
    id;
    name;
    parentCollection;

    constructor(name, parentCollection) {
        if (name && typeof name === "string") {
            this.name = name;
        }

        if (parentCollection && parentCollection instanceof Collection) {
            this.parentCollection = parentCollection
        }
    }

    isValid() {
        this.id = this.id ? bigint.toBigInt(this.id) : undefined;
        this.name = this.name.trim();
        
        if ((this.id && !bigint.isValid(this.id)) ||
            !this.name || typeof this.name !== "string" || !this.name.length ||
            !this.parentCollection || !this.parentCollection instanceof Collection ||
            !this.parentCollection.isValid()) {
            return false;
        }

        return true;
    }

    async save(connection) {
        const isListExisting = await this.exists(connection);

        if (!this.isValid(connection)) {
            throw new ValueError(400, "Invalid List Name");
        }

        if (await this.isDuplicate(connection)) {
            throw new ValueError(400, "List Name Is Already Used");
        }

        if (!isListExisting) {
            await this.#createList(connection);
        } else {
            await this.#updateList(connection);
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

        const queryStatement = `SELECT COUNT(1) AS count FROM lists WHERE ListID = ${this.id}`

        try {
            const queryResult = (await connection.query(queryStatement))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check if list exists: ${error.message}`);
        }
    }

    async #createList(connection) {
        return await existingOrNewConnection(connection, this.#_createList.bind(this));
    }

    async #_createList(connection) {
        const queryStatement = `INSERT INTO lists(CollectionID, Name) VALUES (${this.parentCollection.id}, ` +
            `"${sqlString(this.name)}")`;

        try {
            const queryResult = await connection.query(queryStatement);

            this.id = queryResult.insertId;

            if (!this.id || !bigint.isValid(this.id)) {
                throw new Error("Invalid ID");
            }
        } catch (error) {
            throw new SqlError(`Failed to insert a list: ${error.message}`);
        }
    }

    async #updateList(connection) {
        return await existingOrNewConnection(connection, this.#_updateList.bind(this));
    }

    async #_updateList(connection) {
        const queryStatement = 
            `UPDATE lists SET Name = "${sqlString(this.name)}" WHERE ListID = ${this.id}`;

        try {
            const result = await connection.query(queryStatement);
        } catch (error) {
            throw new SqlError(`Failed to update list: ${error.message}`);
        }
    }

    async #_isDuplicate(connection) {
        const queryStatement = 
            "SELECT COUNT(1) as count FROM lists " +
            `WHERE Name = "${sqlString(this.name)}" AND ListID != ${this.id ? this.id : -1} ` +
            "LIMIT 1";

        try {
            const queryResult = (await connection.query(queryStatement))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check for list duplicate: ${error.message}`);
        }
    }

    static async findByID(id, connection) {
        id = bigint.toBigInt(id);

        if (!bigint.isValid(id)) {
            return null; 
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT c.CollectionID AS CollectionID, l.ListID AS ListID, l.Name AS Name FROM lists l " + 
                "INNER JOIN collections c USING (CollectionID) " +
                `WHERE ListID = ${id}`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return null;
                }
                
                const foundCollection = await Collection.findByID(queryResult[0].CollectionID, connection);
                if (!foundCollection.isValid()) {
                    throw new Error("Failed to retrieve parent collection");
                }

                const foundList = new List(queryResult[0].Name, foundCollection);
                foundList.id = queryResult[0].ListID;

                if (!foundList.isValid()) {
                    return null;
                }

                return foundList;
            } catch (error) {
                throw new SqlError(`Failed to get list from ID: ${error.message}`);
            }
        });
    }

    static async findFromCollection(collection, connection) {
        if (!collection || !collection instanceof Collection || !collection.isValid()) {
            throw new ValueError(400, "Invalid Collection");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `SELECT ListID, Name FROM lists WHERE CollectionID = ${collection.id};`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return [];
                }

                return List.#parseFoundLists(collection, queryResult);
            } catch (error) {
                throw new SqlError(`Failed to get all lists: ${error.message}`);
            }
        });
    }

    static async deleteFromID(id, connection) {
        id = bigint.toBigInt(id);
        if (!bigint.isValid(id)) {
            throw new ValueError(400, "Invalid List ID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `DELETE FROM lists WHERE ListID = ${id}`;

            try {
                const queryResult = await connection.query(queryStatement);
            } catch (error) {
                throw new SqlError(`Failed to delete list ${id}: ${error.message}`);
            }
        });
    }

    static #parseFoundLists(collection, lists) {
        const listsArray = [];

        for (let item of lists) {
            const list = new List(item.Name, collection);
            list.id = item.ListID;

            if (list.isValid()) {
                listsArray.push(list);
            } 
        }
        
        return listsArray;
    }
}

module.exports = {
    List
}
