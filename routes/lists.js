const database = require("../models/gameSortingDB");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError } = require("../utils/errors/exceptions");

module.exports = (app) => {
    /*
    Form to create a new lists in a collection
    */
    app.get("/collections/:collectionID/new", wrapAsync(async (req, res) => {
        const { collectionID } = req.params;

        const collection = await database.find(database.COLLECTIONS, collectionID);

        if (!collection) {
            throw new InternalError(`Failed To Query Collection ${collectionID}`);
        }

        res.render("collections/newList", { collection: collection });
    }));

    /*
    Entry point to list all items inside a list
    */
    app.get("/collections/:collectionID/:listID", wrapAsync(async (req, res) => {
        const { collectionID, listID } = req.params;

        const lists = await database.find(database.ITEMS, collectionID, listID);
        
        if (!lists) {
            throw new InternalError(`Failed To Query Items From List ${listID}`);
        }

        res.render("collections/items", { lists });
    }));

    /*
    Add a new list to a collection
    */
    app.post("/collections/:collectionID", wrapAsync(async (req, res) => {
        const { collectionID } = req.params;
        const { name } = req.body;

        const result = await database.new(database.LISTS, {
            parent: {
                collection: {
                    CollectionID: collectionID
                }
            },
            data: {
                Name : name
            }
        });

        if (!result) {
            throw new InternalError(`Failed To Insert A New List Into Collection ${collectionID}`);
        }

        res.redirect(`/collections/${collectionID}`);
    }));

    /*
    Delete a list from a collection
    */
    app.delete("/collections/:collectionID/:listID", wrapAsync(async (req, res) => {
        const { collectionID, listID } = req.params;

        const result = await database.delete(database.LISTS, { collectionID, listID });

        if (!result) {
            throw new InternalError(`Failed To Delete List ${listID}`);
        }

        res.redirect(`/collections/${collectionID}`);
    }));
}