const database = require("../models/gameSortingDB");

module.exports = (app) => {
    /*
    Form to create a new item in a list in a collection
    */
    app.get("/collections/:collectionID/:listID/new", async (req ,res) => {
        const { collectionID, listID } = req.params;

        if (!await database.exists(database.COLLECTIONS, collectionID)) {
            res.send("Invalid Collection");
            return;
        }

        if (!await database.exists(database.LISTS, collectionID, listID)) {
            res.send("Invalid List");
            return;
        }

        const list = await database.find(database.LISTS, collectionID, listID);

        if (!list) {
            res.send("Cannot find list");
            return;
        }

        res.render("collections/newItem", { list });
    });

    /*
    Display informations about an item
    */
    app.get("/collections/:collectionID/:listID/:itemID", async (req, res) => {
        const { collectionID, listID, itemID } = req.params;

        if (!await database.exists(database.COLLECTIONS, collectionID)) {
            res.send("Invalid Collection");
            return;
        }

        if (!await database.exists(database.LISTS, collectionID, listID)) {
            res.send("Invalid List");
            return;
        }

        if (!await database.exists(database.ITEMS, collectionID, listID, itemID)) {
            res.send("Invalid Item");
            return;
        }

        const item = await database.find(database.ITEMS, collectionID, listID, itemID);

        if (!item) {
            res.send("Failed to get item");
            return;
        }

        res.render("collections/viewItem", { item });
    });
};