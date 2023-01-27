const bcrypt = require("bcryptjs");
const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { sqlString, existingOrNewConnection } = require("../utils/sql/sql");

class User {
    id = undefined;
    username = undefined;
    email = undefined;
    #hashPassword = undefined;

    constructor(username, email, password, hashPassword = true) {
        if (username && typeof username === "string") {
            this.username = username.trim();
        }

        if (email && typeof email === "string") {
            this.email = email.trim();
        }

        if (password && typeof password === "string") {
            this.#hashPassword = 
                hashPassword ? bcrypt.hashSync(password.trim(), 12) : password;
        }
    }

    compare(usernameOrEmail, password) {
        if (!this.isValid() || usernameOrEmail.trim() !== this.username && usernameOrEmail !== this.email) {
            return false;
        }

        return bcrypt.compareSync(password.trim(), this.#hashPassword);
    }

    isValid() {
        this.id = this.id ? bigint.toBigInt(this.id) : undefined;
        this.username = this.username.trim();
        this.email = this.email.trim();

        if (!this.username || typeof this.username !== "string" || !this.username.length ||
            !this.email || typeof this.email !== "string" || !this.email.length ||
            !this.#hashPassword || typeof this.#hashPassword !== "string" || !this.#hashPassword.length ||
            (this.id && !bigint.isValid(this.id))) {
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

    async #_exists(connection) {
        const queryStatement = `SELECT COUNT(UserID) as count FROM users WHERE UserID = ${this.id}`;
        try {
            const foundUser = await connection.query(queryStatement)[0];

            return foundUser.count > 0;
        } catch (error) {
            throw SqlError(`Failed to check if user exists: ${error.message}`);
        }
        
    }

    async #createUser(connection) {
        return await existingOrNewConnection(connection, this.#_createUser.bind(this));
    }

    async #_createUser(connection) {
        const queryStatement = 
            "INSERT INTO users (Username, Email, Password) " +
            `VALUES ("${sqlString(this.username)}", "${sqlString(this.email)}", ` + 
            `"${sqlString(this.#hashPassword)}")`;

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
            `Username = "${sqlString(this.username)}", Email = "${sqlString(this.email)}" ` +
            `Password = "${sqlString(this.#hashPassword)}" ` +
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
            `Username = "${this.username}" OR Email = "${sqlString(this.email)}" ` +
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
                "SELECT UserID, Username, Email, Password " +
                "FROM users " +
                `WHERE Username = "${sqlString(username)}" OR Email = "${sqlString(username)}"`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return null;
                }

                const { UserID, Username, Email, Password } = queryResult[0];

                const foundUser = new User(Username, Email, Password, false);
                foundUser.id = UserID;

                return foundUser;
            } catch (error) {
                throw new SqlError(`Failed to retrieve user: ${error.message}`);
            }
        });
    }
}

module.exports = {
    User
}
