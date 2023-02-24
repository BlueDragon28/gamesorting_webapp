const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { sqlString, existingOrNewConnection } = require("../utils/sql/sql");
const Pagination = require("../utils/sql/pagination");

class Collection {
    id;
    userID;
    name;

    constructor(userID, name) {
        if (bigint.isValid(userID)) {
            this.userID = bigint.toBigInt(userID);
        }

        if (name && typeof name === "string") {
            this.name = name;
        }
    }

    isValid() {
        this.id = this.id ? bigint.toBigInt(this.id) : undefined;
        this.name = this.name.trim();
        
        if ((this.id && !bigint.isValid(this.id)) ||
            !bigint.isValid(this.userID) ||
            !this.name || typeof this.name !== "string" || !this.name.length) {
            return false;
        }

        return true;
    }

    async save(connection) {
        const isCollectionExists = await this.exists(connection);

        if (!this.isValid(connection)) {
            throw new ValueError(400, "Invalid Collection Name");
        }

        if (await this.isDuplicate(connection)) {
            throw new ValueError(400, "Collection Name Is Already Used");
        }

        if (!isCollectionExists) {
            await this.#createCollection(connection);
        } else {
            await this.#updateCollection(connection);
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

        const queryStatement = `SELECT COUNT(1) AS count FROM collections WHERE CollectionID = ${this.id}`

        try {
            const queryResult = (await connection.query(queryStatement))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check if collection exists: ${error.message}`);
        }
    }

    async #createCollection(connection) {
        return await existingOrNewConnection(connection, this.#_createCollection.bind(this));
    }

    async #_createCollection(connection) {
        const queryStatement = 
            `INSERT INTO collections(UserID, Name) VALUES (${this.userID}, "${sqlString(this.name)}")`;

        try {
            const queryResult = await connection.query(queryStatement);

            this.id = queryResult.insertId;

            if (!this.id || !bigint.isValid(this.id)) {
                throw new Error("Invalid ID");
            }
        } catch (error) {
            throw new SqlError(`Failed to insert a collection: ${error.message}`);
        }
    }

    async #updateCollection(connection) {
        return await existingOrNewConnection(connection, this.#_updateCollection.bind(this));
    }

    async #_updateCollection(connection) {
        const queryStatement = 
            `UPDATE collections SET Name = "${sqlString(this.name)}" WHERE CollectionID = ${this.id}`;

        try {
            const result = await connection.query(queryStatement);
        } catch (error) {
            throw new SqlError(`Failed to update collection: ${error.message}`);
        }
    }

    async #_isDuplicate(connection) {
        const queryStatement = 
            "SELECT COUNT(1) as count FROM collections " +
            `WHERE Name = "${sqlString(this.name)}" AND CollectionID != ${this.id ? this.id : -1} ` +
            `AND UserID = ${this.userID} ` +
            "LIMIT 1";

        try {
            const queryResult = (await connection.query(queryStatement))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check for collection duplicate: ${error.message}`);
        }
    }

    static async findByID(id, connection) {
        id = bigint.toBigInt(id);

        if (!bigint.isValid(id)) {
            return null; 
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT UserID, CollectionID, Name FROM collections " + 
                `INNER JOIN users USING (UserID) WHERE CollectionID = ${id}`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return null;
                }

                const foundCollection = new Collection(queryResult[0].UserID, queryResult[0].Name);
                foundCollection.id = queryResult[0].CollectionID;

                if (!foundCollection.isValid()) {
                    return null;
                }

                return foundCollection;
            } catch (error) {
                throw new SqlError(`Failed to get collection from ID: ${error.message}`);
            }
        });
    }

    static async findFromUserID(userID, pageNumber = 0, connection) {
        userID = bigint.toBigInt(userID);
        if (!bigint.isValid(userID) || typeof pageNumber !== "number" || pageNumber < 0) {
            throw new ValueError(400, "Invalid User");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const numberOfItems = await Collection.getCount(userID, connection);

            const pagination = new Pagination(pageNumber, numberOfItems);
            if (!pagination.isValid) {
                throw new ValueError(400, "Invalid page number");
            }

            let queryStatement = 
                "SELECT UserID, CollectionID, Name FROM collections INNER JOIN users USING (UserID) " +
                `WHERE UserID = ${userID} `;

            if (pageNumber !== 0) {
                queryStatement += 
                    `LIMIT ${Pagination.ITEM_PER_PAGES} OFFSET ${Pagination.calcOffset(pageNumber)}`;
            }

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return [[], pagination];
                }

                return [Collection.#parseFoundCollections(queryResult), pagination];
            } catch (error) {
                throw new SqlError(`Failed to get all collections: ${error.message}`);
            }
        });
    }

    static async deleteFromID(id, connection) {
        id = bigint.toBigInt(id);
        if (!bigint.isValid(id)) {
            throw new ValueError(400, "Invalid Collection ID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `DELETE FROM collections WHERE CollectionID = ${id}`;

            try {
                const queryResult = await connection.query(queryStatement);
            } catch (error) {
                throw new SqlError(`Failed to delete collection ${id}: ${error.message}`);
            }
        });
    }

    static async isUserAllowed(userID, collectionID, connection) {
        userID = bigint.toBigInt(userID);
        collectionID = bigint.toBigInt(collectionID);

        if (!bigint.isValid(userID) || !bigint.isValid(collectionID)) {
            throw new ValueError(400, "Invalid UserID or CollectionID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                "SELECT COUNT(*) AS count FROM collections INNER JOIN users USING (UserID) " +
                `WHERE UserID = ${userID} AND CollectionID = ${collectionID}`;

            try {
                const queryResult = await connection.query(queryStatement);

                return queryResult[0].count > 0;
            } catch (error) {
                throw new SqlError(`Failed to check if user is allowed to view this collection`);
            }
        });
    }

    static async getCount(userID, connection) {
        userID = bigint.toBigInt(userID);

        if (!bigint.isValid(userID) || !connection) {
            throw new ValueError(400, "Invalid UserID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `SELECT COUNT(*) as count FROM collections WHERE UserID = ${userID}`;

            try {
                const queryResult = (await connection.query(queryStatement))[0];

                return queryResult.count;
            } catch (error) {
                throw new SqlError(`Failed to query number of items in collections! ${error.message}`);
            }
        });
    }

    static #parseFoundCollections(collections) {
        const collectionsList = [];

        for (let item of collections) {
            const collection = new Collection(item.UserID, item.Name);
            collection.id = item.CollectionID;

            if (collection.isValid()) {
                collectionsList.push(collection);
            } 
        }
        
        return collectionsList;
    }
}

module.exports = {
    Collection
}
