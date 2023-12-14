const bigint = require("../utils/numbers/bigint");
const { SqlError, ValueError } = require("../utils/errors/exceptions");
const { existingOrNewConnection } = require("../utils/sql/sql");

class UserActivity {
    static expirationHours = 30 * 24; // Expiration after 30 days.

    id;
    userID;
    type;
    time;

    constructor(userID, type = undefined, time = undefined) {
        this.userID = userID === null ? undefined : userID;
        this.type = type === null ? undefined : type;
        if (time || typeof time === "number" || typeof time === "bigint") {
            this.time = Number(time);
        } else {
            this.time = Date.now();
        }
    }

    isValid() {
        this.id = this.id !== undefined ? bigint.toBigInt(this.id) : undefined;
        if (typeof this.type === "string") {
            this.type = this.type.trim();
        }

        if ((this.id !== undefined && !bigint.isValid(this.id)) ||
                (this.userID !== undefined && !bigint.isValid(this.userID)) ||
                (this.type !== undefined && (typeof this.type !== "string" || !this.type.length)) ||
                !this.time || typeof this.time !== "number" || this.time <= 0) {
            return false;
        }

        return true;
    }

    async save(connection) {
        if (!this.isValid()) {
            throw new ValueError(400, "Invalid User Activity");
        }

        await this.#createUserActivity(connection);
    }

    async #createUserActivity(connection) {
        return await existingOrNewConnection(connection, this.#_createUserActivity.bind(this));
    }

    async #_createUserActivity(connection) {
        const userID = this.userID ? this.userID : undefined;
        const type = typeof this.type === "string" ? this.type : undefined;

        const queryStatement = 
            "INSERT INTO userActivity(" +
                `${this.userID ? "UserID," : ""}` +
                `${this.type ? "Type," : ""}` +
                "Time) " +
            "VALUES (" +
                `${userID ? "?," : ""}` +
                `${type ? "?," : ""}` +
                "?)";

        const queryArgs = [
            ...(userID && [userID.toString()] || []),
            ...(type && [type] || []),
            this.time,
        ];

        try {
            const queryResult = await connection.query(queryStatement, queryArgs);

            this.id = queryResult.insertId;

            if (!this.id || !bigint.isValid(this.id)) {
                throw new Error("Invalid ID");
            }
        } catch (error) {
            throw new SqlError(`Failed to insert user activity: ${error.message}`);
        }
    }

    static async findByTimelapsFromNow(timelapsHours, connection) {
        return await UserActivity.findByTimelaps(timelapsHours, 0, connection);
    }

    static async findByTimelaps(timelapsHoursBegin, timelapsHoursEnd, connection) {
        if ((typeof timelapsHoursBegin !== "number" &&
            typeof timelapsHoursBegin !== "bigint") ||
            (typeof timelapsHoursEnd !== "number" &&
            typeof timelapsHoursBegin !== "bigint") ||
            timelapsHoursBegin <= 0 || timelapsHoursEnd < 0 || timelapsHoursBegin <= timelapsHoursEnd ||
            isNaN(timelapsHoursBegin) || isNaN(timelapsHoursEnd)) {
            
            throw new ValueError("Invalid timelaps");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const timeNow = new Date();
            timeNow.setHours(0, 0, 0, 0);
            timeNow.setDate(timeNow.getDate() + 1);
            const endOfDay = timeNow.valueOf();
            const begin = endOfDay - UserActivity.#fromHoursToMilliseconds(timelapsHoursBegin);
            const end = endOfDay - UserActivity.#fromHoursToMilliseconds(timelapsHoursEnd);

            const queryStatement =
                "SELECT UserActivityID, UserID, Type, Time FROM userActivity " +
                "WHERE (Time >= ?) AND (Time < ?)";

            const queryArgs = [
                begin,
                end,
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                return UserActivity.#parseUserActivityQuery(queryResult);
            } catch (error) {
                throw new SqlError(`Failed to query UserActivity from timelaps: ${error.message}`);
            }
        });
    }

    static async findUniqueUsersFromTimelaps(timelapsHoursBegin, timelapsHoursEnd = 0, connection) {
        if ((typeof timelapsHoursBegin !== "number" &&
            typeof timelapsHoursBegin !== "bigint") ||
            (typeof timelapsHoursEnd !== "number" &&
            typeof timelapsHoursBegin !== "bigint") ||
            timelapsHoursBegin <= 0 || timelapsHoursEnd < 0 || timelapsHoursBegin <= timelapsHoursEnd ||
            isNaN(timelapsHoursBegin) || isNaN(timelapsHoursEnd)) {
            
            throw new ValueError("Invalid timelaps");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const timeNow = Date.now();
            const begin = timeNow - UserActivity.#fromHoursToMilliseconds(timelapsHoursBegin)
            const end = timeNow - UserActivity.#fromHoursToMilliseconds(timelapsHoursEnd);

            const queryStatement = 
                "SELECT COUNT(*) AS uniqueUsers FROM " +
                "(SELECT UserID FROM userActivity " +
                "WHERE (Time >= ?) AND (Time < ?) AND (UserID IS NOT NULL) " +
                "GROUP BY UserID) AS users";

            const queryArgs = [
                begin,
                end,
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);

                if (!queryResult.length) {
                    return 0;
                }

                if (queryResult[0]?.uniqueUsers) {
                    return queryResult[0].uniqueUsers;
                } else {
                    return -1;
                }
            } catch (error) {
                throw new SqlError(`Failed to query unique users in UserActivity from timelaps: ${error.message}`);
            }
        });
    }

    static async deleteAllAfterTimelaps(timelapsHours, connection) {
        if ((typeof timelapsHours !== "number" &&
            typeof timelapsHours !== "bigint") ||
            timelapsHours <= 0 || isNaN(timelapsHours)) {
            throw new ValueError("Invalid timelaps");
        }

        return await existingOrNewConnection(connection, async function(connection) {
            const timelaps = UserActivity.#fromHoursToMilliseconds(timelapsHours);
            const timeNow = Date.now();
            const oldestTime = timeNow - timelaps;

            const queryStatement = 
                "DELETE FROM userActivity WHERE Time < ?";
            
            const queryArgs = [
                oldestTime
            ];

            try {
                const queryResult = await connection.query(queryStatement, queryArgs);
                return queryResult?.affectedRows;
            } catch (error) {
                throw new SqlError(`Failed to delete user activity from timelaps: ${error.message}`);
            }
        });
    }

    static async #parseUserActivityQuery(queryResult) {
        if (!queryResult.length) {
            return [];
        }

        const usersActivity = []

        for (const item of queryResult) {
            const { UserActivityID, UserID, Type, Time } = item;

            const activity = new UserActivity(UserID, Type, Time);
            activity.id = UserActivityID;

            if (!activity.isValid()) {
                throw new SqlError("UserActivity: Invalid query result!");
            }

            usersActivity.push(activity);
        }

        return usersActivity;
    }

    static #fromHoursToMilliseconds(hours) {
        return hours > 0 ? Number(hours) * 60 * 60 * 1000 : 0;
    }
}

module.exports = {
    UserActivity
};
