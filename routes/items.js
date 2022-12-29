const database = require("../models/gameSortingDB");

module.exports = (app) => {
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