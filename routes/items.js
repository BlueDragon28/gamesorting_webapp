const database = require("../models/gameSortingDB");
const wrapAsync = require("../utils/errors/wrapAsync");
const bigint = require("../utils/numbers/bigint");
const { InternalError, ValueError } = require("../utils/errors/exceptions");

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
This function compare the raw customColumn with the available customDatas.
The goal is to add empty customData if there is no value available.
*/
function addEmptyCustomDataIfNotFound(customDatasList, itemID, customColumn, customDatas) {
    if (!customDatasList || !customColumn || !customDatas) {
        throw new InternalError("Invalid Data");
    }

    for (let customData of customDatas) {
        if (customData.ListColumnTypeID === customColumn.ListColumnTypeID) {
            customDatasList.push(customData);
            return;
        }
    }

    customDatasList.push({
        CustomRowItemsID: -1n,
        ItemID: itemID,
        ListColumnTypeID: customColumn.ListColumnTypeID,
        Value: "",
        ColumnName: customColumn.Name
    });
}

/*
Make sure the empty customDatas do not have the same negative value
*/
function fillNegativeValue(customDatas) {
    let negativeValue = -1n;
    for (let customData of customDatas) {
        if (customData.CustomRowItemsID === -1n) {
            customData.CustomRowItemsID = negativeValue--;
        }
    }
}

/*
Compare raw customColumns with customData and add empty customData if there is no data
*/
function includeEmptyCustomColumnsData(itemData) {
    if (!itemData) {
        throw new InternalError("Invalid Item Data");
    }

    const parsedCustomDatas = [];
    for (let customColumn of itemData.customColumns) {
        addEmptyCustomDataIfNotFound(parsedCustomDatas, itemData.data.ItemID, customColumn, itemData.data.customData);
    }

    fillNegativeValue(parsedCustomDatas);

    itemData.data.customData = parsedCustomDatas;
}

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
    Form to edit an item
    */
    app.get("/collections/:collectionID/:listID/:itemID/edit", wrapAsync(async (req, res) => {
        const { collectionID, listID, itemID } = req.params;

        let item = await database.find(database.ITEMS, collectionID, listID, itemID);

        if (!item) {
            throw new InternalError(`Failed To Query Item ${itemID}`);
        }

        includeEmptyCustomColumnsData(item);

        res.render("collections/lists/items/edit", { item });
    }));

    /*
    Insert a new item into a list inside a collection
    */
    app.post("/collections/:collectionID/:listID", parseCustomColumnsData, wrapAsync(async (req, res) => {
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

        res.redirect(`/collections/${collectionID}/${listID}`);
    }));

    /*
    Edit An Item
    */
    app.put("/collections/:collectionID/:listID/:itemID", parseCustomColumnsData, wrapAsync(async (req, res) => {
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

        res.redirect(`/collections/${collectionID}/${listID}/${itemID}`);
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