const express = require("express");
//const database = require("../models/gameSortingDB");
const { Collection } = require("../models/collections");
const { List } = require("../models/lists");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError } = require("../utils/errors/exceptions");
const validation = require("../utils/validation/validation");
const { parseCelebrateError, errorsWithPossibleRedirect } = require("../utils/errors/celebrateErrorsMiddleware");

const router = express.Router({ mergeParams: true });

/*
Validate collectionID and listID on each route asking for for them
*/
router.use([ "/lists/:listID", "/lists" ], validation.id);

/*
Form to create a new lists in a collection
*/
router.get("/lists/new", wrapAsync(async (req, res) => {
    const { collectionID } = req.params;

    //const collection = await database.find(database.COLLECTIONS, collectionID);
    const collection = await Collection.findByID(collectionID);

    if (!collection) {
        throw new InternalError(`Failed To Query Collection ${collectionID}`);
    }

    res.render("collections/lists/new", { collection });
}));

/*
Entry point to list all items inside a list
*/
router.get("/lists/:listID", wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;

    //const lists = await database.find(database.ITEMS, collectionID, listID);
    const list = await List.findByID(listID);
    
    if (!list) {
        throw new InternalError(`Failed To Query List From List ${listID}`);
    }

    res.render("collections/lists/items/items", { list });
}));

/*
Form to edit a list
*/
router.get("/lists/:listID/edit", wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;

    //const list = await database.find(database.LISTS, collectionID, listID);
    const list = await List.findByID(listID);

    if (!list) {
        throw new InternalError(`Failed To Query Items From List ${listID}`);
    }

    res.render("collections/lists/edit", { list });
}));

/*
Add a new list to a collection
*/
router.post("/lists", validation.item({ name: true }), wrapAsync(async (req, res) => {
    const { collectionID } = req.params;
    const { name } = req.body;

    //const result = await database.new(database.LISTS, {
        //parent: {
            //collection: {
                //CollectionID: collectionID
            //}
        //},
        //data: {
            //Name : name
        //}
    //});
    
    const collection = await Collection.findByID(collectionID);

    if (!collection || !collection instanceof Collection || !collection.isValid()) {
        throw new InternalError("Failed to get collection");
    }

    const newList = new List(name, collection)

    if (!newList.isValid()) {
        throw new ValueError(400, "Invalid List Data");
    }

    await newList.save();

    //if (!result) {
        //throw new InternalError(`Failed To Insert A New List Into Collection ${collectionID}`);
    //}

    req.flash("success", "Successfully created a new list");

     //res.redirect(`/collections/${collectionID}`);
    res.redirect(`${req.baseUrl}`);
}));

/*
Edit list
*/
router.put("/lists/:listID", validation.item({ name: true }), wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;
    const { name } = req.body;

    //const result = await database.edit(database.LISTS, {
        //parent: {
            //collection: {
                //CollectionID: collectionID
            //}
        //},
        //data: {
            //ListID: listID,
            //Name: name
        //}
    //});

    //if (!result) {
        //throw new InternalError(`Failed To Edit A List ${listID}`);
    //}
    
    const list = await List.findByID(listID);
    
    if (!list || !list instanceof List || !list.isValid()) {
        throw new ValueError(400, "Invalid List");
    }

    list.name = name;
    if (!list.isValid()) {
        throw new ValueError(400, "Invalid List Name");
    }

    await list.save();

    req.flash("success", "Successfully updated a list");

    res.redirect(`${req.baseUrl}/lists/${listID}`);
}));

/*
Delete a list from a collection
*/
router.delete("/lists/:listID", wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;

    //const result = await database.delete(database.LISTS, { collectionID, listID });

    //if (!result) {
        //throw new InternalError(`Failed To Delete List ${listID}`);
    //}

    await List.deleteFromID(listID);

    req.flash("success", "Successfully deleted a list");

    res.redirect(`${req.baseUrl}`);
}));

router.use(parseCelebrateError);
//router.use(errorsWithPossibleRedirect("Cannot find this list"));

module.exports = router;
