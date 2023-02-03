const express = require("express");
const { List } = require("../models/lists");
const { ListColumnType } = require("../models/listColumnsType");
const { CustomRowsItems } = require("../models/customUserData");
const { Item } = require("../models/items");
const { deleteItem } = require("../utils/data/deletionHelper");
const wrapAsync = require("../utils/errors/wrapAsync");
const bigint = require("../utils/numbers/bigint");
const { InternalError, ValueError } = require("../utils/errors/exceptions");
const validation = require("../utils/validation/validation");
const customDataValidation = require("../utils/validation/customDataValidation");
const { parseCelebrateError, errorsWithPossibleRedirect } = require("../utils/errors/celebrateErrorsMiddleware");
const { existingOrNewConnection } = require("../utils/sql/sql");

const router = express.Router({ mergeParams: true });

/*
Validate collectionID, listID and itemID on each route asking for for them
*/
router.use([ "/items/:itemID", "/items" ], validation.id);

/*
Setting javascript utils for the new and edit ejs template
*/
function customDataEjsHelper(req, res, next) {
    const { getCustomControlType } = require("../utils/ejs/customControlData");
    res.locals.getCustomControlType = getCustomControlType;
    next();
}

/*
Parse the custom columns data.
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
            [columnIDName]: id.toString(),
            Value: value
        });
    }

    req.body.customColumns = customColumnsData;
    next();
}

/*
Form to create a new item in a list in a collection
*/
router.get("/items/new", customDataEjsHelper, wrapAsync(async (req ,res) => {
    const { collectionID, listID } = req.params;

    const list = await List.findByID(listID);

    if (!list || !list instanceof List || !list.isValid()) {
        throw new InternalError("Failed To Find List");
    }

    const listColumnsType = await ListColumnType.findFromList(list);

    if (!listColumnsType || !Array.isArray(listColumnsType)) {
        throw new InternalError("Failed To Retrieve List Columns Type");
    }

    res.render("collections/lists/items/new", { list, listColumnsType });
}));

/*
Display informations about an item
*/
router.get("/items/:itemID", wrapAsync(async (req, res) => {
    const { collectionID, listID, itemID } = req.params;

    const item = await Item.findByID(itemID);

    if (!item || !item instanceof Item || !item.isValid()) {
        throw new InternalError("Failed To Retrieve Item");
    }

    const listColumnsType = await ListColumnType.findFromList(item.parentList);

    if (!listColumnsType || !Array.isArray(listColumnsType)) {
        throw new InternalError("Failed To Retrieve List Columns Type");
    }

    res.render("collections/lists/items/view", { item, listColumnsType });
}));

/*
Form to edit an item
*/
router.get("/items/:itemID/edit", customDataEjsHelper, wrapAsync(async (req, res) => {
    const { collectionID, listID, itemID } = req.params;

    const item = await Item.findByID(itemID);

    if (!item || !item instanceof Item || !item.isValid()) {
        throw new InternalError("Failed To Query Item");
    }

    const listColumnsType = await ListColumnType.findFromList(item.parentList);

    if (!listColumnsType || !Array.isArray(listColumnsType)) {
        throw new InternalError("Failed To Retrieve List Columns Type");
    }

    res.render("collections/lists/items/edit", { item, listColumnsType });
}));

/*
Insert a new item into a list inside a collection
*/
router.post("/items", parseCustomColumnsData, 
            validation.item({ name: true, url: true, customData: true }),
            customDataValidation.parseColumnsType, customDataValidation.validate(), wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;
    const { name, url, customColumns } = req.body;

    const parentList = await List.findByID(listID);

    if (!parentList || !parentList instanceof List || !parentList.isValid()) {
        throw new InternalError("Invalid List");
    }

    const newItem = new Item(name, url, parentList);

    if (!newItem) {
        throw new ValueError(400, "Invalid Name or URL");
    }

    await newItem.save();
 
    for (let customColumn of customColumns) {
        const customUserData = new CustomRowsItems(
            customColumn.Value, 
            newItem.id, 
            customColumn.ListColumnTypeID);
        
        if (customUserData.isValid()) {
            await customUserData.save();
        }
    }

    req.flash("success", "Successfully created a new item");
    res.redirect(req.baseUrl);
}));

/*
Edit An Item
*/
router.put("/items/:itemID", parseCustomColumnsData, 
            validation.item({ name: true, url: true, customData: true }),
    customDataValidation.parseColumnsType, customDataValidation.validate(), wrapAsync(async (req, res) => {
    const { collectionID, listID, itemID } = req.params;
    const { name, url, customColumns } = req.body;

    // Find Item
    const foundItem = await Item.findByID(itemID);

    if (!foundItem || !foundItem instanceof Item || !foundItem.isValid()) {
        throw new InternalError("Invalid Item");
    }

    // Find column type
    const foundColumnsType = await ListColumnType.findFromList(foundItem.parentList);

    // Update item
    foundItem.name = name;
    foundItem.url = url;

    if (!foundItem.isValid()) {
        throw new ValueError(400, "Invalid Name Or Url");
    }

    // Find existing custom data
    const customData = [];
    for (let columnType of foundColumnsType) {
        const foundCustomRow = foundItem.customData.find(row => row.columnTypeID === columnType.id);
        if (foundCustomRow) {
            customData.push(foundCustomRow);
        }
    }

    // Update/Create custom data or delete unused one
    for (let userCustomColumn of customColumns) {
        let foundCustomData;
        if (userCustomColumn.CustomRowItemsID > 0) {
            foundCustomData = customData.find(data => data.id == userCustomColumn.CustomRowItemsID);
        } else {
            foundCustomData = new CustomRowsItems(undefined, foundItem.id, -userCustomColumn.CustomRowItemsID);
        }

        if (!foundCustomData) {
            continue;
        }

        foundCustomData.value = userCustomColumn.Value;

        if (foundCustomData.isValid()) {
            await foundCustomData.save();
        } else {
            await foundCustomData.delete();
        }
    }

    await foundItem.save();

    req.flash("success", "Successfully updated an item");
    res.redirect(`${req.baseUrl}/items/${itemID}`);
}));

/*
Delete an item from a list
*/
router.delete("/items/:itemID", wrapAsync(async (req, res) => {
    const { collectionID, listID, itemID } = req.params;

    await existingOrNewConnection(undefined, async function(connection) {
        await deleteItem(itemID, connection);
    });

    req.flash("success", "Successfully deleted an item");
    res.redirect(req.baseUrl);
}));

router.use(parseCelebrateError);
router.use(errorsWithPossibleRedirect("Cannot thind this item"));

module.exports = router;
