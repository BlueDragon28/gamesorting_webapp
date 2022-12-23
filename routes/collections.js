/*
The routes of the collections
*/
const database = require("../models/gameSortingDB");

module.exports = (app) => {
    /*
    Entry to see the collections list.
    */
    app.get("/collections", async (req, res) => {
        const collections = await database.find(database.COLLECTIONS);

        if (!collections) {
            res.send("<h1>Failed to query collections</h1>");
        }

        res.render("collections/collectionsIndex.ejs", { collections });
    });
};