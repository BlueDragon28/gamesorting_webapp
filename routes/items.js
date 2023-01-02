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

        console.dir(list);

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

        console.log(item);

        res.render("collections/viewItem", { item });
    });

    /*
    Insert a new item into a list inside a collection
    */
    app.post("/collections/:collectionID/:listID", async (req, res) => {
        const { collectionID, listID } = req.params;
        const { name, url } = req.body;

        if (!await database.exists(database.COLLECTIONS, collectionID)) {
            res.send("Invalid Collection");
            return;
        }

        if (!await database.exists(database.LISTS, collectionID, listID)) {
            res.send("Invalid List");
            return;
        }

        if (typeof name !== "string" || name.length === 0) {
            res.send("Name is Required");
            return;
        }

        const queryResult = await database.new(database.ITEMS, {
            parent: {
                collection: { CollectionID: collectionID },
                list: { ListID: listID }
            },
            data: {
                name,
                url
            }
        });

        if (!queryResult) {
            res.send("Failed to insert a new element");
            return;
        }

        res.redirect(`/collections/${collectionID}/${listID}`);
    });

    /*
    Delete an item from a list
    */
    app.delete("/collections/:collectionID/:listID/:itemID", async (req, res) => {

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

        const queryResult = await database.delete(database.ITEMS, {
            collectionID,
            listID,
            itemID
        });

        if (!queryResult) {
            res.send("Failed to delete item");
            return;
        }

        res.redirect(`/collections/${collectionID}/${listID}`);
    });
};