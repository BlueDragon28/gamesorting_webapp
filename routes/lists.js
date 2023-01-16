const express = require("express");
const database = require("../models/gameSortingDB");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError } = require("../utils/errors/exceptions");

const router = express.Router();

/*
Form to create a new lists in a collection
*/
router.get("/:collectionID/lists/new", wrapAsync(async (req, res) => {
    const { collectionID } = req.params;

    const collection = await database.find(database.COLLECTIONS, collectionID);

    if (!collection) {
        throw new InternalError(`Failed To Query Collection ${collectionID}`);
    }

    res.render("collections/lists/new", { collection: collection });
}));

/*
Entry point to list all items inside a list
*/
router.get("/:collectionID/lists/:listID", wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;

    const lists = await database.find(database.ITEMS, collectionID, listID);
    
    if (!lists) {
        throw new InternalError(`Failed To Query Items From List ${listID}`);
    }

    res.render("collections/lists/items/items", { lists });
}));

/*
Form to edit a list
*/
router.get("/:collectionID/lists/:listID/edit", wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;

    const list = await database.find(database.LISTS, collectionID, listID);

    if (!list) {
        throw new InternalError(`Failed To Query Items From List ${listID}`);
    }

    res.render("collections/lists/edit", { list });
}));

/*
Add a new list to a collection
*/
router.post("/:collectionID/lists", wrapAsync(async (req, res) => {
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

    // res.redirect(`/collections/${collectionID}`);
    res.redirect(`${req.baseUrl}/${collectionID}`);
}));

/*
Edit list
*/
router.put("/:collectionID/lists/:listID", wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;
    const { name } = req.body;

    const result = await database.edit(database.LISTS, {
        parent: {
            collection: {
                CollectionID: collectionID
            }
        },
        data: {
            ListID: listID,
            Name: name
        }
    });

    if (!result) {
        throw new InternalError(`Failed To Edit A List ${listID}`);
    }

    // res.redirect(`/collections/${collectionID}/${listID}`);
    res.redirect(`${req.baseUrl}/${collectionID}/lists/${listID}`);
}));

/*
Delete a list from a collection
*/
router.delete("/:collectionID/lists/:listID", wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;

    const result = await database.delete(database.LISTS, { collectionID, listID });

    if (!result) {
        throw new InternalError(`Failed To Delete List ${listID}`);
    }

    // res.redirect(`/collections/${collectionID}`);
    res.redirect(`${req.baseUrl}/${collectionID}`);
}));

module.exports = router;