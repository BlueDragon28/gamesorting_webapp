const mariadb = require("./connection");
const path = require("path");
const fs = require("node:fs");

async function clearDatabase() {
    const sqlStatement = 
        "DELETE FROM collections; " +
        "DELETE FROM lists; " +
        "DELETE FROM listColumnsType; " +
        "DELETE FROM items; " +
        "DELETE FROM customRowsItems; " +
        "DELETE FROM users;";

    mariadb.getConnection(async function(connection) {
        connection.query(sqlStatement);
    });
}

async function seedsDatabase() {
    const sqlStatement = fs.readFileSync(path.join(__dirname, "seeds.sql"), "utf8");

    mariadb.getConnection(async function(connection) {
        connection.query(sqlStatement);
    });
}

module.exports = {
    clear: clearDatabase,
    seeds: seedsDatabase
};
