const database = require("../models/gameSortingDB");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError } = require("../utils/errors/exceptions");

module.exports = (app) => {
    /*
    Form to create a new item in a list in a collection
    */
    app.get("/collections/:collectionID/:listID/new", wrapAsync(async (req ,res) => {
        const { collectionID, listID } = req.params;

        const list = await database.find(database.LISTS, collectionID, listID);

        if (!list) {
            throw new InternalError(`Failed To Query List ${listID}`);
        }

        res.render("collections/lists/items/new", { list });
    }));

    /*
    Display informations about an item
    */
    app.get("/collections/:collectionID/:listID/:itemID", wrapAsync(async (req, res) => {
        const { collectionID, listID, itemID } = req.params;

        const item = await database.find(database.ITEMS, collectionID, listID, itemID);

        if (!item) {
            throw new InternalError(`Failed To Query Item ${itemID}`);
        }

        res.render("collections/lists/items/view", { item });
    }));

    /*
    Insert a new item into a list inside a collection
    */
    app.post("/collections/:collectionID/:listID", wrapAsync(async (req, res) => {
        const { collectionID, listID } = req.params;
        const { name, url } = req.body;

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
            throw new InternalError(`Failed To Insert A New Item Into List ${listID}`);
        }

        res.redirect(`/collections/${collectionID}/${listID}`);
    }));

    /*
    Delete an item from a list
    */
    app.delete("/collections/:collectionID/:listID/:itemID", wrapAsync(async (req, res) => {

        const { collectionID, listID, itemID } = req.params;

        const queryResult = await database.delete(database.ITEMS, {
            collectionID,
            listID,
            itemID
        });

        if (!queryResult) {
            throw new InternalError(`Failed To Delete Item ${itemID}`);
        }

        res.redirect(`/collections/${collectionID}/${listID}`);
    }));
};