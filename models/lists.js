const bigint = require("../utils/numbers/bigint");
const { User } = require("./users");
const { Collection } = require("./collections");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { existingOrNewConnection } = require("../utils/sql/sql");
const Pagination = require("../utils/sql/pagination");

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
        this.id = this.id !== undefined ? bigint.toBigInt(this.id) : undefined;
        this.name = typeof this.name === "string" ? this.name.trim() : undefined;
        
        if ((this.id !== undefined && !bigint.isValid(this.id)) ||
            !this.name || typeof this.name !== "string" || !this.name.length ||
            !this.parentCollection || !this.parentCollection instanceof Collection ||
            !this.parentCollection.isValid()) {
            return false;
        }

        return true;
    }

    async save(connection) {
        const isListExisting = await this.exists(connection);

        if (!this.isValid(connection) || 
            (!bigint.isValid(this.parentCollection.id))) {
            throw new ValueError(400, "Invalid List");
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

    toBaseObject() {
        if (!this.isValid()) return;

        return {
            id: this.id,
            name: this.name,
            parentCollectionID: this.parentCollection.id
        };
    }

    async #_exists(connection) {
        if (!this.isValid()) {
            return false;
        }

        const queryStatement = "SELECT COUNT(1) AS count FROM lists WHERE ListID = ?";

        const queryArgs = [
            this.id
        ];

        try {
            const queryResult = (await connection.query(queryStatement, queryArgs))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check if list exists: ${error.message}`);
        }
    }

    async #createList(connection) {
        return await existingOrNewConnection(connection, this.#_createList.bind(this));
    }

    async #_createList(connection) {
        const queryStatement = "INSERT INTO lists(CollectionID, Name) VALUES (?, ?)";

        const queryArgs = [
            this.parentCollection.id,
            this.name,
        ];

        try {
            const queryResult = await connection.query(queryStatement, queryArgs);

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
            "UPDATE lists SET Name = ? WHERE ListID = ?";

        const queryArgs = [
            this.name, 
            this.id
        ];

        try {
            const result = await connection.query(queryStatement, queryArgs);
        } catch (error) {
            throw new SqlError(`Failed to update list: ${error.message}`);
        }
    }

    async #_isDuplicate(connection) {
        const queryStatement = 
            "SELECT COUNT(1) as count FROM lists " +
            "WHERE Name = ? AND ListID != ? " +
            "AND CollectionID = ? " +
            "LIMIT 1";

        const queryArgs = [
            this.name,
            this.id ? this.id : -1,
            this.parentCollection.id,
        ];

        try {
            const queryResult = (await connection.query(queryStatement, queryArgs))[0];

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
                `WHERE ListID = ?`;
            
            const queryArgs = [
                id
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

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

    static async findFromCollection(collection, pageNumber = 0, connection) {
        if (!collection || !collection instanceof Collection || !collection.isValid() ||
                typeof pageNumber !== "number" || pageNumber < 0) {
            throw new ValueError(400, "Invalid Collection");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const numberOfItems = await List.getCount(collection, connection);

            const pagination = new Pagination(pageNumber, numberOfItems);
            if (!pagination.isValid) {
                throw new ValueError(400, "Invalid page number");
            }

            let queryStatement = 
                "SELECT ListID, Name FROM lists WHERE CollectionID = ? ";

            const queryArgs = [
                collection.id,
            ];

            if (pageNumber !== 0) {
                queryStatement += 
                    "LIMIT ? OFFSET ? ";
                queryArgs.push(
                    Pagination.ITEM_PER_PAGES,
                    Pagination.calcOffset(pageNumber)
                );
            }

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (!queryResult.length) {
                    return [[], pagination];
                }

                return [List.#parseFoundLists(collection, queryResult), pagination];
            } catch (error) {
                throw new SqlError(`Failed to get all lists: ${error.message}`);
            }
        });
    }

    static async findAllListFromUserByName(user, name = "", currentList = null, connection = null) {
        if (!user || !user instanceof User || !user.isValid() ||
                (currentList && (!currentList instanceof List || !currentList.isValid())) ||
                typeof name !== "string") {
            throw new ValueError(400, "Invalid User or Search Value");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT c.CollectionID AS CollectionID, c.UserID as UserID, " + 
                "c.Name AS CNAME, l.ListID AS ListID, l.Name AS LNAME " +
                "FROM lists l " +
                "INNER JOIN collections c USING (CollectionID) " +
                "WHERE c.UserID = ? " + 
                    (currentList && "AND l.ListID != ? " || "") +
                    " AND (l.Name LIKE ? OR c.Name LIKE ?) " +
                "LIMIT ?";

            const searchText = `%${name.replaceAll(" ", "%")}%`;

            const queryArgs = [
                user.id,
                ...(currentList && [currentList.id] || []),
                searchText, 
                searchText,
                30
            ];

            try {
                const queryResult = await connection.query(
                    queryStatement, 
                    queryArgs
                );

                if (!queryResult.length) {
                    return [];
                }

                return List.parseFoundListsFromUser(queryResult);
            } catch (error) {
                throw new SqlError(`Failed to query lists: ${error.message}`);
            }
        });
    }

    static async findFromUser(userID, connection = null) {
        if (!userID || !bigint.isValid(userID)) {
            throw new ValueError(400, "Invalid User");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                `SELECT c.CollectionID AS CollectionID, c.UserID AS UserID, 
                c.Name AS CNAME, l.ListID AS ListID, l.Name AS LNAME 
                FROM lists l 
                INNER JOIN collections c USING (CollectionID) 
                WHERE c.UserID = ? 
                ORDER BY CNAME ASC 
                LIMIT ?`;
            const queryArgs = [
                userID,
                Pagination.ITEM_PER_PAGES
            ];

            try {
                const queryResult = await connection.query(
                    queryStatement,
                    queryArgs
                );

                if (!queryResult.length) {
                    return [];
                }

                return List.parseFoundListsFromUser(queryResult);
            } catch (error) {
                throw new SqlError(`Failed to query lists: ${error.message}`);
            }
        });
    }

    static parseFoundListsFromUser(queryResult) {
        const listOfLists = [];

        for (const queryList of queryResult) {
            const collection = new Collection(queryList.UserID, queryList.CNAME);
            collection.id = queryList.CollectionID;

            const list = new List(queryList.LNAME, collection);
            list.id = queryList.ListID;

            if (!collection.isValid() || !list.isValid()) {
                throw new SqlError("Failed to retrieve list from name");
            }

            listOfLists.push(list);
        }

        return listOfLists;
    }

    static async deleteFromID(id, connection) {
        id = bigint.toBigInt(id);
        if (!bigint.isValid(id)) {
            throw new ValueError(400, "Invalid List ID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "DELETE FROM lists WHERE ListID = ?";

            const queryArgs = [
                id
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (queryResult.affectedRows === 0) {
                    throw ValueError(400, "Invalid List ID");
                }
            } catch (error) {
                throw new SqlError(`Failed to delete list ${id}: ${error.message}`);
            }
        });
    }

    static async isUserAllowed(userID, listID, connection) {
        userID = bigint.toBigInt(userID);
        listID = bigint.toBigInt(listID);

        if (!bigint.isValid(userID) || !bigint.isValid(listID)) {
            throw new ValueError(400, "Invalid UserID or ListID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                "SELECT COUNT(*) AS count FROM lists INNER JOIN collections USING (CollectionID) " + 
                `INNER JOIN users USING (UserID) WHERE UserID = ? AND ListID = ?`;

            const queryArgs = [
                userID,
                listID,
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                return queryResult[0].count > 0;
            } catch (error) {
                throw new SqlError(`Failed to check if user is allowed to view this list`);
            }
        });
    }

    static async getCount(collection, connection) {
        if (!collection.isValid()) {
            throw new ValueError(400, "Invalid collection");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT COUNT(*) AS count FROM lists " + 
                "WHERE CollectionID = ?";

            const queryArgs = [
                collection.id
            ];
                
            try {
                const queryResult = (await connection.query(queryStatement, queryArgs))[0];

                return queryResult.count;
            } catch (error) {
                throw new SqlError(`Failed to query number of items in lists: ${error.message}`);
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
