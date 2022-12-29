const database = require("../models/gameSortingDB");

module.exports = (app) => {
    /*
    Form to create a new lists in a collection
    */
    app.get("/collections/:collectionID/new", async (req, res) => {
        const { collectionID } = req.params;

        if (!await database.exists(database.COLLECTIONS, collectionID)) {
            res.send("Invalid Collection");
            return;
        }

        const collection = await database.find(database.COLLECTIONS, collectionID);

        if (!collection) {
            res.send("Failed to get collection");
            return;
        }

        res.render("collections/newList", { collection: collection[0] });
    });

    /*
    Entry point to list all items inside a list
    */
    app.get("/collections/:collectionID/:listID", async (req, res) => {
        const { collectionID, listID } = req.params;

        if (!await database.exists(database.COLLECTIONS, collectionID)) {
            res.send("Invalid Collection");
            return;
        }

        if (!await database.exists(database.LISTS, collectionID, listID)) {
            res.send("Invalid Lists");
            return;
        }

        const lists = await database.find(database.ITEMS, collectionID, listID);
        
        if (!lists) {
            res.send(`<h1>Failed to query items from list ${listID}`);
            return;
        }

        res.render("collections/items", { lists });
    });

    /*
    Add a new list to a collection
    */
    app.post("/collections/:collectionID", async (req, res) => {
        const { collectionID } = req.params;
        const { name } = req.body;

        if (!await database.exists(database.COLLECTIONS, collectionID)) {
            res.send("Invalid Collection");
            return;
        }

        const result = await database.new(database.LISTS, { collectionID, name });

        if (!result) {
            res.send("<h1>Failed to create a new list</h1>");
            return;
        }

        res.redirect(`/collections/${collectionID}`);
    });
}