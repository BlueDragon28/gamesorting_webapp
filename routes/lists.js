const express = require("express");
const { Collection } = require("../models/collections");
const { List } = require("../models/lists");
const { Item } = require("../models/items");
const { CustomRowsItems } = require("../models/customUserData");
const { ListColumnType } = require("../models/listColumnsType");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError, AuthorizationError, ValueError } = require("../utils/errors/exceptions");
const validation = require("../utils/validation/validation");
const { listColumnsValidation, validateDeleteColumn } = require("../utils/validation/listColumnsValidation");
const { 
    parseCelebrateError, 
    errorsWithPossibleRedirect,
    returnHasJSONIfNeeded } = require("../utils/errors/celebrateErrorsMiddleware");
const { deleteList, deleteCustomDatasFromListColumnType } = require("../utils/data/deletionHelper");
const { existingOrNewConnection } = require("../utils/sql/sql");
const { checkCollectionAuth, checkListAuth } = require("../utils/users/authorization");
const { trimColumns, checkForDuplicate, checkForDuplicateWithCurrentColumns, retrievePreviousColumns } = 
    require("../utils/data/listCustomColumnsMiddlewares");

const router = express.Router({ mergeParams: true });

/*
Validate collectionID and listID on each route asking for for them
*/
router.use([ "/lists/:listID", "/lists" ], validation.id);

/*
Form to create a new lists in a collection
*/
router.get("/lists/new", checkCollectionAuth, wrapAsync(async (req, res) => {
    const { collectionID } = req.params;

    const collection = await Collection.findByID(collectionID);

    if (!collection) {
        throw new InternalError(`Failed To Query Collection ${collectionID}`);
    }

    res.render("collections/lists/new", { collection });
}));

/*
Entry point to list all items inside a list
*/
router.get("/lists/:listID", checkListAuth, wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;

    const list = await List.findByID(listID);
    const items = await Item.findFromList(list);
    
    if (!list) {
        throw new InternalError(`Failed To Query List From List ${listID}`);
    }

    if (!items) {
        throw new InternalError("Failed To Query Items From List");
    }

    res.render("collections/lists/items/items", { list, items });
}));

/*
Add or remove custom columns to the list
*/
router.get("/lists/:listID/custom-columns", checkListAuth, wrapAsync(async (req, res) => {
    const { listID } = req.params;

    const [list, listCustomColumns] = await existingOrNewConnection(null, async connection => {
        const list = await List.findByID(listID, connection);
        const listCustomColumns = await ListColumnType.findFromList(list, connection);

        return [list, listCustomColumns];
    });

    res.render("collections/lists/customColumns/edit", { list, listCustomColumns });
}));

/*
Post route to add and delete custom columns
*/
router.post("/lists/:listID/custom-columns", 
    checkListAuth, 
    trimColumns,
    checkForDuplicate, 
    retrievePreviousColumns,
    checkForDuplicateWithCurrentColumns,
    listColumnsValidation(),
    wrapAsync(async (req, res) => {
        const { listID } = req.params;
        const { columnsToDelete } = req.body;
        let { newColumns } = req.body;

        await existingOrNewConnection(null, async function(connection) {
            const parentList = 
                newColumns.length ? await List.findByID(listID, connection) : null;

            for (let column of columnsToDelete) {
                await deleteCustomDatasFromListColumnType(column.id, connection);
                await ListColumnType.deleteFromID(column.id, connection);
            }

            for (let column of newColumns) {
                const newColumn = new ListColumnType(column.name, column.type, parentList);
                await newColumn.save(connection);
            }
        });

        res.send("Data received");
}));

router.delete("/lists/:listID/custom-column",
        checkListAuth,
        validateDeleteColumn(),
        wrapAsync(async function(req, res) {
    
    const { customColumn } = req.body;

    await existingOrNewConnection(null, async function(connection) {
        await deleteCustomDatasFromListColumnType(customColumn.id, connection);
        await ListColumnType.deleteFromID(customColumn.id, connection);
    });

    res.set("Content-type", "application/json")
        .send({ type: "SUCCESS", message: "Successfully delete column!" })
}));

/*
Form to edit a list
*/
router.get("/lists/:listID/edit", checkListAuth, wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;

    const list = await List.findByID(listID);

    if (!list) {
        throw new InternalError(`Failed To Query Items From List ${listID}`);
    }

    res.render("collections/lists/edit", { list });
}));

/*
Add a new list to a collection
*/
router.post("/lists", checkCollectionAuth, validation.item({ name: true }), wrapAsync(async (req, res) => {
    const { collectionID } = req.params;
    const { name } = req.body;

    const collection = await Collection.findByID(collectionID);

    if (!collection || !collection instanceof Collection || !collection.isValid()) {
        throw new InternalError("Failed to get collection");
    }

    const newList = new List(name, collection)

    if (!newList.isValid()) {
        throw new ValueError(400, "Invalid List Data");
    }

    await newList.save();

    req.flash("success", "Successfully created a new list");

    res.redirect(`${req.baseUrl}`);
}));

/*
Edit list
*/
router.put("/lists/:listID", checkListAuth, validation.item({ name: true }), wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;
    const { name } = req.body;

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
router.delete("/lists/:listID", checkListAuth, wrapAsync(async (req, res) => {
    const { collectionID, listID } = req.params;

    await existingOrNewConnection(undefined, async function(connection) {
        await deleteList(listID, connection);
    });

    req.flash("success", "Successfully deleted a list");
    res.redirect(`${req.baseUrl}`);
}));

router.use(parseCelebrateError);
router.use(returnHasJSONIfNeeded);
router.use(errorsWithPossibleRedirect("Cannot find this list"));

module.exports = router;
