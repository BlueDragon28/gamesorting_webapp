const express = require("express");
const database = require("../models/gameSortingDB");
const wrapAsync = require("../utils/errors/wrapAsync");
const bigint = require("../utils/numbers/bigint");
const utilCustomData = require("../utils/data/customData");
const { InternalError, ValueError } = require("../utils/errors/exceptions");
const validation = require("../utils/validation/validation");

const router = express.Router();

/*
Parse the custom columns data.
The format used is :
[
    {
        ListColumnTypeID: ID of the custom column type,
        Value: The value of this column for a specific item
    }
]
*/
function parseCustomColumnsData(req, res, next) {
    if (!req.body.customColumns) {
        req.body.customColumns = [];
    }

    const customColumnsData = [];

    for (let [strID, value] of Object.entries(req.body.customColumns)) {
        const id = bigint.toBigInt(strID.split("_")[1]);

        if (!bigint.isValid(id)) {
            throw new ValueError(400, "Invalid ListColumnTypeID");
        }

        const columnIDName = req.method === "POST" ? "ListColumnTypeID" : "CustomRowItemsID";

        customColumnsData.push({
            [columnIDName]: id,
            Value: value
        });
    }

    req.body.customColumns = customColumnsData;
    next();
}

/*
Form to create a new item in a list in a collection
*/
router.get("/:collectionID/lists/:listID/items/new", validation.id.list, wrapAsync(async (req ,res) => {
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
router.get("/:collectionID/lists/:listID/items/:itemID", validation.id.item, wrapAsync(async (req, res) => {
    const { collectionID, listID, itemID } = req.params;

    const item = await database.find(database.ITEMS, collectionID, listID, itemID);

    if (!item) {
        throw new InternalError(`Failed To Query Item ${itemID}`);
    }

    res.render("collections/lists/items/view", { item });
}));

/*
Form to edit an item
*/
router.get("/:collectionID/lists/:listID/items/:itemID/edit", validation.id.item, wrapAsync(async (req, res) => {
    const { collectionID, listID, itemID } = req.params;

    let item = await database.find(database.ITEMS, collectionID, listID, itemID);

    if (!item) {
        throw new InternalError(`Failed To Query Item ${itemID}`);
    }

    utilCustomData.includeEmpty(item);

    res.render("collections/lists/items/edit", { item });
}));

/*
Insert a new item into a list inside a collection
*/
router.post("/:collectionID/lists/:listID/items", validation.id.list, validation.item({ name: true }), 
            parseCustomColumnsData, wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;
    const { name, url, customColumns } = req.body;

    const queryResult = await database.new(database.ITEMS, {
        parent: {
            collection: { CollectionID: collectionID },
            list: { ListID: listID }
        },
        data: {
            name,
            url,
            customData: customColumns
        }
    });

    if (!queryResult) {
        throw new InternalError(`Failed To Insert A New Item Into List ${listID}`);
    }

    res.redirect(`${req.baseUrl}/${collectionID}/lists/${listID}`);
}));

/*
Edit An Item
*/
router.put("/:collectionID/lists/:listID/items/:itemID", validation.id.item, validation.item({ name: true }), 
            parseCustomColumnsData, wrapAsync(async (req, res) => {
    const { collectionID, listID, itemID } = req.params;
    const { name, url, customColumns } = req.body;

    const queryResult = await database.edit(database.ITEMS, {
        parent: {
            collection: { CollectionID: collectionID },
            list: { ListID: listID }
        },
        data: {
            ItemID: itemID,
            Name: name,
            URL: url,
            customData: customColumns
        }
    });

    if (!queryResult) {
        throw new InternalError(`Failed To Edit Item ${itemID}`)
    }

    res.redirect(`${req.baseUrl}/${collectionID}/lists/${listID}/items/${itemID}`);
}));

/*
Delete an item from a list
*/
router.delete("/:collectionID/lists/:listID/items/:itemID", validation.id.item, wrapAsync(async (req, res) => {

    const { collectionID, listID, itemID } = req.params;

    const queryResult = await database.delete(database.ITEMS, {
        collectionID,
        listID,
        itemID
    });

    if (!queryResult) {
        throw new InternalError(`Failed To Delete Item ${itemID}`);
    }

    res.redirect(`${req.baseUrl}/${collectionID}/lists/${listID}`);
}));

module.exports = router;