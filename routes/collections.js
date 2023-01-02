/*
The routes of the collections
*/
const database = require("../models/gameSortingDB");

module.exports = (app) => {
    /*
    Entry to see the collections list
    */
    app.get("/collections", async (req, res) => {
        const collections = await database.find(database.COLLECTIONS);

        if (!collections) {
            res.send("<h1>Failed to query collections</h1>");
            return;
        }

        res.render("collections/collectionsIndex.ejs", { collections });
    });

    /*
    Form to create a new collection
    */
    app.get("/collections/new", (req, res) => {
        res.render("collections/new");
    });

    /*
    Entry to see the lists available inside a collection
    */
    app.get("/collections/:collectionID", async (req, res) => {
        const { collectionID } = req.params;

        const lists = await database.find(database.LISTS, collectionID);

        if (!lists) {
            res.send("<h1>Failed to query the lists from the collection");
            return;
        }

        res.render("collections/lists.ejs", { lists });
    });

    /*
    Create a new collection
    */
    app.post("/collections", async (req, res) => {
        const { name } = req.body;

        const result = await database.new(database.COLLECTIONS, {
            data: {
                Name: name
            }
        });

        if (!result) {
            res.send("<h1>Failed to insert a new collection.");
            return;
        }

        res.redirect("/collections");
    });

    /*
    Delete a collection
    */
    app.delete("/collections/:collectionID", async (req, res) => {
        const { collectionID } = req.params;
        
        if (!collectionID) {
            res.send("<h1>Invalid ID</h1>");
            return;
        }

        const result = await database.delete(database.COLLECTIONS, collectionID);

        if (!result) {
            res.send(`<h1>Failed to delete ${collectionID}`);
            return;
        }

        res.redirect("/collections");
    });
};