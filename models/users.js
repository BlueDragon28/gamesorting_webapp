const bcrypt = require("bcryptjs");
const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { existingOrNewConnection } = require("../utils/sql/sql");
const Pagination = require("../utils/sql/pagination");

class User {
    id = undefined;
    username = undefined;
    email = undefined;
    bypassRestriction = undefined;
    #hashPassword = undefined;
    isAdmin = undefined;

    constructor(username, email, password, hashPassword = true) {
        if (username && typeof username === "string") {
            this.username = username.trim();
        }

        if (email && typeof email === "string") {
            this.email = email.trim();
        }

        this.setPassword(password, hashPassword);
    }

    compare(usernameOrEmail, password) {
        if (!this.isValid() || usernameOrEmail.trim() !== this.username && usernameOrEmail !== this.email) {
            return false;
        }

        return bcrypt.compareSync(password.trim(), this.#hashPassword);
    }

    isValid() {
        this.id = this.id !== undefined ? bigint.toBigInt(this.id) : undefined;
        this.username = typeof this.username === "string" ? this.username.trim() : undefined
        this.email = typeof this.email === "string" ? this.email.trim() : undefined;
        
        if (!this.username || typeof this.username !== "string" || !this.username.length ||
            !this.email || typeof this.email !== "string" || !this.email.length ||
            !this.#hashPassword || typeof this.#hashPassword !== "string" || !this.#hashPassword.length ||
            (this.id !== undefined && !bigint.isValid(this.id)) ||
            (this.bypassRestriction !== undefined && typeof this.bypassRestriction !== "boolean") ||
            (this.isAdmin !== undefined && typeof this.isAdmin !== "boolean")) {
            return false;
        }

        return true;
    }

    async save(connection) {
        const isUserExists = await this.exists(connection);

        if (await this.isDuplicate(connection)) {
            throw new ValueError(400, "User name or email already exists");
        }

        if (!this.isValid()) {
            throw new ValueError(400, "Invalid user informations");
        }

        if (!isUserExists) {
            await this.#createUser(connection);
        } else {
            await this.#updateUser(connection);
        }
    }

    async delete(connection) {
        if (!this.isValid()) {
            return;
        }

        await User.deleteFromID(this.id, connection);
    }

    async exists(connection) {
        if (!this.id) {
            return false;
        }


        return await existingOrNewConnection(connection, this.#_exists.bind(this));
    }

    async isDuplicate(connection) {
        return await existingOrNewConnection(connection, this.#_isDuplicate.bind(this));
    }

    toBaseObject() {
        return {
            id: this.id.toString(),
            username: this.username,
            email: this.email
        };
    }

    setPassword(password, hashPassword = true) {
        if (password && typeof password === "string" && password.trim().length) {
            this.#hashPassword = 
                hashPassword ? bcrypt.hashSync(password.trim(), 12) : password;
        }
    }

    async #_exists(connection) {
        const queryStatement = "SELECT COUNT(UserID) as count FROM users WHERE UserID = ?";

        const queryArgs = [
            this.id ? this.id : -1
        ];

        try {
            const foundUser = (await connection.query(queryStatement, queryArgs))[0];

            return foundUser.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check if user exists: ${error.message}`);
        }
        
    }

    async #createUser(connection) {
        return await existingOrNewConnection(connection, this.#_createUser.bind(this));
    }

    async #_createUser(connection) {
        const queryStatement = 
            "INSERT INTO users (Username, Email, Password, BypassRestriction, IsAdmin) " +
            "VALUES (?, ?, ?, ?, ?)";

        const queryArgs = [
            this.username,
            this.email,
            this.#hashPassword,
            this.bypassRestriction === true ? true : false,
            this.isAdmin === true ? true : false
        ];

        try {
            const result = await connection.query(queryStatement, queryArgs);

            this.id = result.insertId;

            if (!this.id) {
                throw new Error("Invalid ID");
            }
        } catch (error) {
            throw new SqlError(`Failed to insert a user: ${error.message}`);
        }
    }

    async #updateUser(connection) {
        return await existingOrNewConnection(connection, this.#_updateUser.bind(this));
    }

    async #_updateUser(connection) {
        const queryStatement = 
            "UPDATE users SET " +
            "Username = ?, Email = ?, " +
            "Password = ?, " +
            "BypassRestriction = ?, " +
            "IsAdmin = ? " +
            "WHERE UserID = ?";

        const queryArgs = [
            this.username,
            this.email,
            this.#hashPassword,
            this.bypassRestriction === true && true || false,
            this.isAdmin === true && true || false,
            this.id,
        ];

        try {
            const result = await connection.query(queryStatement, queryArgs);
        } catch (error) {
            throw new SqlError(`Failed to update a user: ${error.message}`);
        }
    }

    async #_isDuplicate(connection) {
        if (!this.isValid()) {
            return false;
        }

        const queryStatement = 
            "SELECT COUNT(1) AS count FROM users WHERE " +
            "(Username = ? OR Email = ?) " +
            "AND UserID != ? " + 
            "LIMIT 1";

        const queryArgs = [
            this.username,
            this.email,
            this.id ? this.id : -1,
        ];

        try {
            const queryResult = (await connection.query(queryStatement, queryArgs))[0];

            return queryResult.count > 0;
        } catch (error) {
            throw new SqlError(`Failed to check for user duplicate: ${error.message}`);
        }
    }

    static async findByNameOrEmail(username, connection) {
        if (!username || typeof username !== "string" || !username.length) {
            return null;
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT UserID, Username, Email, Password, BypassRestriction, IsAdmin " +
                "FROM users " +
                "WHERE Username = ? OR Email = ?";

            const queryArgs = [
                username,
                username,
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (!queryResult.length) {
                    return null;
                }

                const { UserID, Username, Email, Password, BypassRestriction, IsAdmin } = queryResult[0];

                const foundUser = new User(Username, Email, Password, false);
                foundUser.id = UserID;
                foundUser.isAdmin = typeof IsAdmin === "boolean" ? IsAdmin : undefined;
                foundUser.bypassRestriction = BypassRestriction !== 0 ? true : false;

                return foundUser;
            } catch (error) {
                throw new SqlError(`Failed to retrieve user: ${error.message}`);
            }
        });
    }

    static async findByID(userID, connection) {
        if (!bigint.isValid(userID)) {
            throw new ValueError(400, "Invalid User");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT UserID, Username, Email, Password, BypassRestriction, IsAdmin FROM users WHERE UserID = ?";

            const queryArgs = [
                userID
            ];
            
            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (!queryResult.length) {
                    return null;
                }

                const { UserID, Username, Email, Password, BypassRestriction, IsAdmin } = queryResult[0];

                const foundUser = new User(Username, Email, Password, false);
                foundUser.id = UserID;
                foundUser.isAdmin = IsAdmin === 1 ? true : IsAdmin === 0 ? false : undefined;
                foundUser.bypassRestriction = BypassRestriction !== 0 ? true : false;

                return foundUser;
            } catch (error) {
                throw new SqlError(`Failed to retrieve user: ${error.message}`);
            }
        });
    }

    static async findUsers(pageNumber = 0, connection) {
        if (typeof pageNumber !== "number" || pageNumber < 0) {
            throw new ValueError(400, "Invalid page number");
        }

        if (pageNumber === 0) {
            pageNumber = 1;
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const numberOfItems = await User.getCount(connection);

            const pagination = new Pagination(pageNumber, numberOfItems);
            if (!pagination.isValid) {
                throw new ValueError(400, "Invalid page number");
            }

            const queryStatement =
                "SELECT UserID, Username, Email, Password, BypassRestriction, IsAdmin FROM users " +
                "LIMIT ? OFFSET ?";

            const queryArgs = [
                Pagination.ITEM_PER_PAGES,
                Pagination.calcOffset(pageNumber),
            ];
            
            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (!queryResult.length) {
                    return [[], pagination];
                }

                return [User.#parseFoundUsers(queryResult), pagination];
            } catch (error) {
                throw new SqlError(`Failed to get all users: ${error.message}`);
            }
        });
    }

    static async deleteFromID(userID, connection) {
        if (!bigint.isValid(userID)) {
            throw new ValueError(400, "Invalid User");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                "DELETE FROM users WHERE UserID = ?";

            const queryArgs = [
                userID
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (queryResult.affectedRows === 0) {
                    throw ValueError(400, "Invalid User ID");
                }
            } catch (error) {
                throw new SqlError(`Failed to retrieve user: ${error.message}`);
            }
        });
    }

    static async isBypassingRestriction(userID, connection) {
        if (!bigint.isValid(userID)) {
            throw new ValueError(400, "Invalid User");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const user = await User.findByID(userID, connection);

            return user.bypassRestriction === true;
        });
    }

    static async isAdmin(userID, connection) {
        if (!bigint.isValid(userID)) {
            throw new ValueError(400, "Invalid User");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const user = await User.findByID(userID, connection);

            return user.isAdmin === true;
        });
    }

    static async getCount(connection) {
        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT COUNT(*) AS count FROM users";

            try {
                const queryResult = (await connection.query(queryStatement))[0];

                return queryResult.count;
            } catch(error) {
                throw new SqlError(`Failed to query number of items in users! ${error.message}`);
            }
        });
    }

    static async checkIfItsDuplicate(username, email, connection) {
        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                "SELECT COUNT(1) AS count FROM users WHERE " +
                "(Username = ? OR Email = ?) " +
                "LIMIT 1";

            const queryArgs = [
                username,
                email,
            ];

            try {
                const queryResult = (await connection.query(queryStatement, queryArgs))[0];

                return queryResult.count > 0;
            } catch (err) {
                throw new SqlError(`Failed to check if user is username or email is duplicate: ${err.message}`);
            }
        });
    }

    static #parseFoundUsers(users) {
        const usersList = [];

        for (const item of users) {
            const user = new User(item.Username, item.Email, item.Password, false);
            user.isAdmin = item.IsAdmin;
            user.bypassRestriction = item.BypassRestriction;
            user.id = item.UserID;

            usersList.push(user);
        }

        return usersList;
    }
}

module.exports = {
    User
}
