/*
The routes of the collections
*/
const express = require("express");
const database = require("../models/gameSortingDB");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError } = require("../utils/errors/exceptions");

const router = express.Router();

/*
Entry to see the collections list
*/
router.get("/", wrapAsync(async (req, res) => {
    const collections = await database.find(database.COLLECTIONS);

    if (!collections) {
        throw new InternalError("Failed To Query Collections");
    }

    res.render("collections/collectionsIndex.ejs", { collections });
}));

/*
Form to create a new collection
*/
router.get("/new", (req, res) => {
    res.render("collections/new");
});

/*
Entry to see the lists available inside a collection
*/
router.get("/:collectionID", wrapAsync(async (req, res) => {
    const { collectionID } = req.params;

    const lists = await database.find(database.LISTS, collectionID);

    if (!lists) {
        throw new InternalError(`Failed To Query Lists From Collection ${collectionID}`);
    }

    res.render("collections/lists/lists.ejs", { lists });
}));

/*
Form to edit a collection
*/
router.get("/:collectionID/edit", wrapAsync(async (req, res) => {
    const { collectionID } = req.params;

    const collection = await database.find(database.COLLECTIONS, collectionID);

    if (!collection) {
        throw new InternalError(`Failed To Query Lists From Collection ${collectionID}`);
    }

    res.render("collections/edit", { collection });
}));

/*
Create a new collection
*/
router.post("/", wrapAsync(async (req, res) => {
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
Edit a collection
*/
router.put("/:collectionID", wrapAsync(async (req, res) => {
    const { collectionID } = req.params;
    const { name } = req.body;

    const result = await database.edit(database.COLLECTIONS, {
        data: {
            CollectionID : collectionID,
            Name: name
        }
    });

    if (!result) {
        throw new InternalError("Failed To Edit A Collection");
    }

    res.redirect(`/collections/${collectionID}`);
}));

/*
Delete a collection
*/
router.delete("/:collectionID", wrapAsync(async (req, res) => {
    const { collectionID } = req.params;


    const result = await database.delete(database.COLLECTIONS, collectionID);

    if (!result) {
        throw new InternalError(`Failed To Delete Collection ${collectionID}`);
    }

    res.redirect("/collections");
}));

module.exports = router;