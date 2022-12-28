const database = require("../models/gameSortingDB");

module.exports = (app) => {
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
}