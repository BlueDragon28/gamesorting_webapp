const { User } = require("./users");
const bigint = require("../utils/numbers/bigint");
const { v4: uuid, validate: uuidValidate } = require("uuid");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { sqlString, existingOrNewConnection } = require("../utils/sql/sql");

class UserLostPassword {
    static maxTime = 
        process.env.NODE_ENV === "production" ? 
            1000 * 60 * 60 * 2 :
            1000 * 60 * 2;

    id = undefined;
    parentUser = undefined;
    token = undefined;
    time = undefined;

    constructor(parentUser, id = undefined, token = undefined, time = undefined) {
        if (!parentUser || !parentUser instanceof User || !parentUser.isValid()) {
            return;
        }

        this.parentUser = parentUser;

        if (id !== undefined) {
            if (bigint.isValid(id)) {
                this.id = bigint.toBigInt(id);
            } else {
                this.id = "Invalid ID";
                return;
            }
        }

        if (token !== undefined && typeof token === "string" && uuidValidate(token)) {
            this.token = token;
        } else if (token === undefined) {
            this.token = uuid();
        } else {
            this.token = "invalid token";
        } 

        if (time === undefined) {
            this.time = new Date();
        } else if (time instanceof Date && !isNaN(time.valueOf())) {
            this.time = time;
        } else if (typeof time === "string") {
            time = UserLostPassword.toDate(time);

            if (!isNaN(time.valueOf())) {
                this.time = time;
            } else {
                this.time = "Invalid Date";
            }
        } else if (typeof time === "number") {
            time = new Date(time);

            if (!isNaN(time.valueOf())) {
                this.time = time;
            } else {
                this.time = "Invalid Date";
            }
        } else {
            this.time = "Invalid Date";
        }
    }

    isValid() {
        this.id = this.id !== undefined ? bigint.toBigInt(this.id) : undefined;

        if ((this.id !== undefined && !bigint.isValid(this.id)) ||
                (!this.parentUser || !this.parentUser instanceof User || !this.parentUser.isValid()) ||
                (typeof this.token !== "string" || !uuidValidate(this.token)) ||
                (!this.time instanceof Date || isNaN(this.time.valueOf()))) {
            return false;
        }

        return true;
    }

    isRecent() {
        const now = Date.now();
        const elapse = now - this.time;
        return elapse <= UserLostPassword.maxTime;
    }

    async save(connection) {
        if (!this.isValid()) {
            throw new ValueError(400, "Invalid Lost User Data");
        }

        await this.#createUserLostPassword(connection);
    }

    async delete(connection) {
        if (!this.isValid()) {
            throw new ValueError(400, "Cannot delete invalid Lost User Token");
        }

        await UserLostPassword.deleteFromID(this.id, connection);
    }

    async #createUserLostPassword(connection) {
        return await existingOrNewConnection(connection, this.#_createUserLostPassword.bind(this));
    }

    async #_createUserLostPassword(connection) {
        if (this.parentUser.id === undefined || !bigint.isValid(this.parentUser.id)) {
            throw new ValueError(400, "User is either invalid or not saved!");
        }

        const queryStatement =
            "INSERT INTO usersLostPassword(UserID, Token, Time) " +
            `VALUES (${this.parentUser.id}, "${sqlString(this.token)}", ${this.time.valueOf()})`;


        try {
            const result = await connection.query(queryStatement);

            this.id = result.insertId;

            if (!this.id) {
                throw new Error("Invalid ID");
            }
        } catch (error) {
            throw new SqlError(`Failed to insert a User Lost Password data: ${error.message}`);
        }
    }

    static async findByToken(token, connection) {
        if (typeof token !== "string" || !uuidValidate(token)) {
            throw new ValueError("Invalid Token");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                "SELECT UserLostID, UserID, Token, Time " +
                "FROM usersLostPassword " +
                `WHERE Token = "${sqlString(token)}"`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (!queryResult.length) {
                    return null;
                }

                const { UserLostID, UserID, Token, Time } = queryResult[0];

                const foundUser = await User.findByID(UserID, connection);

                if (!foundUser instanceof User || !foundUser.isValid()) {
                    return null
                }

                const foundLostUser = new UserLostPassword(foundUser, UserLostID, Token, Number(Time));

                return foundLostUser;
            } catch (error) {
                throw new SqlError(`Failed to retrieve lost user from token: ${error.message}`);
            }
        });
    }

    static async deleteFromID(lostUserID, connection) {
        if (!bigint.isValid(lostUserID)) {
            throw new ValueError(400, "Invalid ID");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const queryStatement = 
                `DELETE FROM usersLostPassword WHERE UserLostID = "${lostUserID}"`;

            try {
                const queryResult = await connection.query(queryStatement);

                if (queryResult.affectedRows === 0) {
                    throw ValueError(400, "Invalid ID");
                }
            } catch (error) {
                throw new SqlError(`Failed to delete lost user id token: ${error.message}`);
            }
        });
    }

    static async deleteExpiredToken(connection) {
        return await existingOrNewConnection(connection, async function(connection) {
            const expiredMaxDate = Date.now() - UserLostPassword.maxTime;

            const queryStatement = 
                "DELETE FROM usersLostPassword " +
                `WHERE Time < ${expiredMaxDate}`;

            try {
                await connection.query(queryStatement);
            } catch (error) {
                throw new SqlError(`Failed to delete expired token: ${error.message}`);
            }
        });
    }

    static parseTime(time) {
        const [year, month, day, hours, minutes, seconds] = [
            time.getUTCFullYear(),
            String("0" + (time.getUTCMonth())).slice(-2),
            String("0" + time.getUTCDate()).slice(-2),
            String("0" + time.getUTCHours()).slice(-2),
            String("0" + time.getUTCMinutes()).slice(-2),
            String("0" + time.getUTCSeconds()).slice(-2)
        ];

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    static toDate(time) {
        const splitString = time.split(" ");
        const splitDate = splitString[0].split("-");
        const splitTime = splitString[1].split(":");

        const date = new Date();
        date.setUTCFullYear(splitDate[0]);
        date.setUTCMonth(splitDate[1]);
        date.setUTCDate(splitDate[2]);
        date.setUTCHours(splitTime[0]);
        date.setUTCMinutes(splitTime[1]);
        date.setUTCSeconds(splitTime[2]);
        date.setUTCMinutes("0000");

        return date;
    }
}

module.exports = {
    UserLostPassword
};
