/*
The routes of the collections
*/
const express = require("express");
const { Collection } = require("../models/collections");
const { List } = require("../models/lists");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError } = require("../utils/errors/exceptions");
const validation = require("../utils/validation/validation");
const { parseCelebrateError, errorsWithPossibleRedirect } = require("../utils/errors/celebrateErrorsMiddleware");
const { deleteCollection } = require("../utils/data/deletionHelper");
const { existingOrNewConnection } = require("../utils/sql/sql");

const router = express.Router();

/*
Validate collectionID on each route asking for collection id
*/
router.use("/:collectionID", validation.id);

/*
Entry to see the collections list
*/
router.get("/", wrapAsync(async (req, res) => {
    const collections = await Collection.findAll();

    if (!collections || !Array.isArray(collections)) {
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

    const collection = await Collection.findByID(collectionID);
    const lists = await List.findFromCollection(collection);

    if (!collection || !collection.isValid()) {
        throw new InternalError(`Failed To Query Collection ${collectionID}`);
    }

    if (!lists || !Array.isArray(lists)) {
        throw new InternalError(`Failed To Query Lists From Collection ${collectionID}`);
    }

    res.render("collections/lists/lists.ejs", { collection, lists });
}));

/*
Form to edit a collection
*/
router.get("/:collectionID/edit", wrapAsync(async (req, res) => {
    const { collectionID } = req.params;

    const collection = await Collection.findByID(collectionID);

    if (!collection) {
        throw new InternalError(`Failed To Query Lists From Collection ${collectionID}`);
    }

    res.render("collections/edit", { collection });
}));

/*
Create a new collection
*/
router.post("/", validation.item({ name: true }), wrapAsync(async (req, res) => {
    const { name } = req.body;

    const newCollection = new Collection(name);

    if (!newCollection.isValid()) {
        throw new InternalError("Failed To Insert A New Collection");
    }

    await newCollection.save();

    req.flash("success", "Successfully created a new collection");

    res.redirect(req.baseUrl);
}));

/*
Edit a collection
*/
router.put("/:collectionID", validation.item({ name: true }), wrapAsync(async (req, res) => {
    const { collectionID } = req.params;
    const { name } = req.body;

    const foundCollection = await Collection.findByID(collectionID);
    if (foundCollection) {
        foundCollection.name = name;
    }

    if (!foundCollection || !foundCollection.isValid()) {
        throw new InternalError("Failed To Edit A Collection");
    }

    await foundCollection.save();

    req.flash("success", "Successfully updated a collection");

    res.redirect(`${req.baseUrl}/${collectionID}`);
}));

/*
Delete a collection
*/
router.delete("/:collectionID", wrapAsync(async (req, res) => {
    const { collectionID } = req.params;

    await existingOrNewConnection(undefined, async function(connection) {
        await deleteCollection(collectionID, connection);
    });

    req.flash("success", "Successfully deleted a collection");

    res.redirect(req.baseUrl);
}));

/*
Parsing celebrate errors
*/
router.use(parseCelebrateError);

//router.use(errorsWithPossibleRedirect("Cannot find this collection"));

module.exports = router;
