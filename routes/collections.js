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

    /*
    Entry to see the lists available inside a collection
    */
    app.get("/collections/:collectionID", async (req, res) => {
        const { collectionID } = req.params;

        const lists = await database.find(database.LISTS, collectionID);

        if (!lists) {
            res.send("<h1>Failed to query the lists from the collection");
        }

        res.render("collections/lists.ejs", { lists });
    });
};