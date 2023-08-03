const express = require("express");
const { User } = require("../models/users");
const { List } = require("../models/lists");
const { ListColumnType } = require("../models/listColumnsType");
const { CustomRowsItems } = require("../models/customUserData");
const { Item } = require("../models/items");
const { deleteItem } = require("../utils/data/deletionHelper");
const wrapAsync = require("../utils/errors/wrapAsync");
const bigint = require("../utils/numbers/bigint");
const { InternalError, ValueError, AuthorizationError, SqlError } = require("../utils/errors/exceptions");
const validation = require("../utils/validation/validation");
const customDataValidation = require("../utils/validation/customDataValidation");
const { 
    parseCelebrateError, 
    errorsWithPossibleRedirect, 
    returnHasJSONIfNeeded 
} = require("../utils/errors/celebrateErrorsMiddleware");
const { existingOrNewConnection } = require("../utils/sql/sql");
const { checkListAuth, checkItemAuth } = require("../utils/users/authorization");
const { isItemLaxLimitMiddleware, isCustomColumnsLimitReachedMiddleware } = require("../utils/validation/limitNumberElements");
const { moveItemTo } = require("../utils/sql/moveTo");
const { importFromList } = require("../utils/sql/importFrom");

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
router.get("/items/new", checkListAuth, customDataEjsHelper, wrapAsync(async (req ,res) => {
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
router.get("/items/:itemID", 
        checkItemAuth, 
        wrapAsync(async (req, res) => {

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
router.get("/items/:itemID/edit", checkItemAuth, customDataEjsHelper, wrapAsync(async (req, res) => {
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

router.get("/items/:itemID/move-to", checkItemAuth, wrapAsync(async (req, res) => {
    const { listID, itemID } = req.params;
    const { search = "" } = req.query;
    
    const [item, list, searchedLists] = await existingOrNewConnection(null, async function(connection) {
        const user = await User.findByID(req.session.user.id, connection);
        if (!user?.isValid()) {
            throw new ValueError(404, "Could not find this user");
        }

        const list = await List.findByID(listID, connection);
        if (!list?.isValid()) {
            throw new ValueError(404, "Could not find valid list");
        }

        const item = await Item.findByID(itemID, connection);
        if (!item?.isValid()) {
            throw new ValueError(404, "Could not find valid item");
        }

        const searchedLists = await List.findAllListFromUserByName(
            user,
            search,
            list,
            connection
        );

        if (!Array.isArray(searchedLists)) {
            throw new ValueError("Failed to search for lists");
        }
        
        return [item, list, searchedLists];
    });

    res.render("collections/lists/items/move-to.ejs", {
        item,
        list,
        searchedLists,
        searchText: search
    });
}));

/*
Insert a new item into a list inside a collection
*/
router.post("/items", checkListAuth, isItemLaxLimitMiddleware, parseCustomColumnsData, 
            validation.item({ name: true, url: true, customData: true }),
            customDataValidation.parseColumnsType, customDataValidation.validate(), wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;
    const { name, url, rating, customColumns } = req.body;

    const parentList = await List.findByID(listID);

    if (!parentList || !parentList instanceof List || !parentList.isValid()) {
        throw new InternalError("Invalid List");
    }

    const newItem = new Item(name, url, parentList);
    newItem.rating = rating;

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
router.put("/items/:itemID", checkItemAuth, parseCustomColumnsData, 
            validation.item({ name: true, url: true, customData: true }),
    customDataValidation.parseColumnsType, customDataValidation.validate(), wrapAsync(async (req, res) => {
    const { collectionID, listID, itemID } = req.params;
    const { name, url, rating, customColumns } = req.body;

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
    foundItem.rating = rating;

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

router.post("/items/:itemID/move-to", 
    checkItemAuth,
    isCustomColumnsLimitReachedMiddleware,
    validation.validateMoveItemTo(),
    wrapAsync(async (req, res) => {
        const { listID, itemID } = req.params;
        const { moveToListID } = req.body;

        await existingOrNewConnection(null, async function(connection) {
            try {
                const item = await Item.findByID(itemID, connection);

                if (!item || !item instanceof Item || !item.isValid()) {
                    throw new ValueError(404, "Failed to find this list");
                }

                const [moveToList, list, newColumnsID] = await importFromList(
                    moveToListID,
                    listID,
                    req.session.user.id,
                    connection
                );

                await moveItemTo(list, moveToList, item, newColumnsID, connection);
            } catch (err) {
                if (err instanceof ValueError || err instanceof SqlError ||
                        err instanceof InternalError) {

                    throw err;
                }

                throw new InternalError("Oups, something went wrong");
            }
        });

        res.send("Hello");
    })
);

/*
Delete an item from a list
*/
router.delete("/items/:itemID", checkItemAuth, wrapAsync(async (req, res) => {
    const paramsListID = bigint.toBigInt(req.params.itemID);
    const itemID = bigint.toBigInt(req.body.itemID);

    if (!bigint.isValid(itemID) || itemID <= 0 ||
        !bigint.isValid(paramsListID) || itemID !== paramsListID) {
        return res.set("Content-type", "application/json")
            .status(400)
            .send({
                type: "ERROR",
                message: "Invalid item id!"
            });
    }

    await existingOrNewConnection(undefined, async function(connection) {
        await deleteItem(itemID, connection);
    });

    const successMessage = "Successfully deleted an item";
    req.flash("success", successMessage);
    res.set("Content-type", "application/json")
        .send({
            type: "SUCCESS",
            message: successMessage
        });
}));

router.use(parseCelebrateError);
router.use(returnHasJSONIfNeeded);
router.use(errorsWithPossibleRedirect("Cannot thind this item"));

module.exports = router;
