/*
The routes of the collections
*/
const database = require("../models/gameSortingDB");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError } = require("../utils/errors/exceptions");

module.exports = (app) => {
    /*
    Entry to see the collections list
    */
    app.get("/collections", wrapAsync(async (req, res) => {
        const collections = await database.find(database.COLLECTIONS);

        if (!collections) {
            throw new InternalError("Failed To Query Collections");
        }

        res.render("collections/collectionsIndex.ejs", { collections });
    }));

    /*
    Form to create a new collection
    */
    app.get("/collections/new", (req, res) => {
        res.render("collections/new");
    });

    /*
    Entry to see the lists available inside a collection
    */
    app.get("/collections/:collectionID", wrapAsync(async (req, res) => {
        const { collectionID } = req.params;

        const lists = await database.find(database.LISTS, collectionID);

        if (!lists) {
            throw new InternalError(`Failed To Query Lists From Collection ${collectionID}`);
        }

        res.render("collections/lists.ejs", { lists });
    }));

    /*
    Create a new collection
    */
    app.post("/collections", wrapAsync(async (req, res) => {
        const { name } = req.body;

        const result = await database.new(database.COLLECTIONS, {
            data: {
                Name: name
            }
        });

        if (!result) {
            throw new InternalError("Failed To Insert A New Collection");
        }

        res.redirect("/collections");
    }));

    /*
    Delete a collection
    */
    app.delete("/collections/:collectionID", wrapAsync(async (req, res) => {
        const { collectionID } = req.params;


        const result = await database.delete(database.COLLECTIONS, collectionID);

        if (!result) {
            throw new InternalError(`Failed To Delete Collection ${collectionID}`);
        }

        res.redirect("/collections");
    }));
};