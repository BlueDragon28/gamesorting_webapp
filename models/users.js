const bcrypt = require("bcryptjs");
const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { sqlString, existingOrNewConnection } = require("../utils/sql/sql");

class User {
    id = undefined;
    username = undefined;
    email = undefined;
    bypassRestriction = undefined;
    #hashPassword = undefined;

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
            (this.bypassRestriction !== undefined && typeof this.bypassRestriction !== "boolean")) {
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
        const queryStatement = `SELECT COUNT(UserID) as count FROM users WHERE UserID = ${this.id ? this.id : -1}`;
        try {
            const foundUser = (await connection.query(queryStatement))[0];

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
            `INSERT INTO users (Username, Email, Password ${this.bypassRestriction === true ? ", BypassRestriction" : ""}) ` +
            `VALUES ("${sqlString(this.username)}", "${sqlString(this.email)}", ` + 
            `"${sqlString(this.#hashPassword)}" ${this.bypassRestriction === true ? ", \"TRUE\"" : ""})`;

        try {
            const result = await connection.query(queryStatement);

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
            `Username = "${sqlString(this.username)}", Email = "${sqlString(this.email)}", ` +
            `Password = "${sqlString(this.#hashPassword)}", ` +
            `BypassRestriction = ${this.bypassRestriction === true ? "TRUE" : "FALSE"} ` +
            `WHERE UserID = ${this.id}`;

        try {
            const result = await connection.query(queryStatement);
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
            `(Username = "${this.username}" OR Email = "${sqlString(this.email)}") ` +
            `AND UserID != ${this.id ? this.id : -1} ` + 
            "LIMIT 1";

        try {
            const queryResult = (await connection.query(queryStatement))[0];

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
                "SELECT UserID, Username, Email, Password, BypassRestriction " +
                "FROM users " +
                `WHERE Username = "${sqlString(username)}" OR Email = "${sqlString(username)}"`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return null;
                }

                const { UserID, Username, Email, Password, BypassRestriction } = queryResult[0];

                const foundUser = new User(Username, Email, Password, false);
                foundUser.id = UserID;
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
                `SELECT UserID, Username, Email, Password, BypassRestriction FROM users WHERE UserID = ${userID}`;
            
            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return null;
                }

                const { UserID, Username, Email, Password, BypassRestriction } = queryResult[0];

                const foundUser = new User(Username, Email, Password, false);
                foundUser.id = UserID;
                foundUser.bypassRestriction = BypassRestriction !== 0 ? true : false;

                return foundUser;
            } catch (error) {
                throw new SqlError(`Failed to retrieve user: ${error.message}`);
            }
        });
    }

    static async deleteFromID(userID, connection) {
        if (!bigint.isValid(userID)) {
            throw new ValueError(400, "Invalid User");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement =
                `DELETE FROM users WHERE UserID = ${userID}`;

            try {
                const queryResult = await connection.query(queryStatement);
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
}

module.exports = {
    User
}
