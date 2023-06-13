const express = require("express");
const { Collection } = require("../models/collections");
const { List } = require("../models/lists");
const { Item } = require("../models/items");
const { ListColumnType } = require("../models/listColumnsType");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError, ValueError } = require("../utils/errors/exceptions");
const validation = require("../utils/validation/validation");
const { listColumnsValidation, validateDeleteColumn, validateUpdateColumn } = require("../utils/validation/listColumnsValidation");
const { searchOptionsValidation } = require("../utils/validation/searchOptionsValidation");
const { 
    parseCelebrateError, 
    errorsWithPossibleRedirect,
    returnHasJSONIfNeeded } = require("../utils/errors/celebrateErrorsMiddleware");
const { deleteList, deleteCustomDatasFromListColumnType } = require("../utils/data/deletionHelper");
const { existingOrNewConnection } = require("../utils/sql/sql");
const { checkCollectionAuth, checkListAuth } = require("../utils/users/authorization");
const { isUserPasswordValid } = require("../utils/users/authentification");
const { trimColumns, checkForDuplicate, checkForDuplicateWithCurrentColumns, retrievePreviousColumns } = 
    require("../utils/data/listCustomColumnsMiddlewares");
const bigint = require("../utils/numbers/bigint");
const Pagination = require("../utils/sql/pagination");
const { isListMaxLimitMiddleware, isCustomColumnsLimitMiddleware } = require("../utils/validation/limitNumberElements");
const { ListSorting } = require("../models/listSorting");

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
router.get("/lists/:listID", 
        checkListAuth, 
        Pagination.parseItemsPageNumberMiddleware, 
        Pagination.saveRestoreReverseItemsOrderMiddleware,
        searchOptionsValidation,
        Pagination.parseSearchOptions,
        wrapAsync(async (req, res) => {

    const { collectionID, listID } = req.params;
    const pageNumber = req.query.pn;
    const isReverse = req.query.reverse === "true" ? true : false;
    const searchParams = req.session.searchParams;

    const [list, items, pagination] = await existingOrNewConnection(null, async function(connection) {
        const list = await List.findByID(listID, connection);

        if (req.query.reverse) {
            let foundListSorting = await ListSorting.findByList(list, connection);
            if (!foundListSorting) {
                foundListSorting = new ListSorting("no-order", list);
            }
            foundListSorting.reverseOrder = req.query.reverse;

            await foundListSorting.save(connection);
        }

        const [items, pagination] = 
            await Item.findFromList(
                list, 
                pageNumber, 
                isReverse, 
                connection, 
                searchParams);
        return [list, items, pagination];
    });
    
    if (!list) {
        throw new InternalError(`Failed To Query List From List ${listID}`);
    }

    if (!items) {
        throw new InternalError("Failed To Query Items From List");
    }

    res.render("collections/lists/items/items", { list, items, pagination, searchParams });
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
Options on how to sort the items.
*/
router.get("/lists/:listID/sorting-options", checkListAuth, wrapAsync(async (req, res) => {
    const { listID } = req.params;

    const [foundList, foundListSorting] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        if (!foundList.isValid()) {
            throw new ValueError(404, "Could not find valid list");
        }

        const foundListSorting = await ListSorting.findByList(foundList, connection);

        if (foundListSorting !== null && 
            (!foundListSorting instanceof ListSorting || !foundListSorting.isValid())) {
            throw new ValueError(500, "Invalid list sorting");
        }

        return [foundList, foundListSorting];
    });

    res.render("collections/lists/sorting/edit", { 
        list: foundList,
        listSorting: foundListSorting
    });
}));

router.post("/lists/:listID/sorting-options", 
    checkListAuth, 
    wrapAsync(async (req, res, next) => 
{
    const { listID } = req.params;
    const { type: sortingType, setTo: sortingSetTo } = req.body;

    if (sortingType !== "sorting") {
        return next({ statusCode: 400, message: "Invalid type" });
    }

    const [success, error] = await existingOrNewConnection(null, async function(connection) {
        try {
            const foundList = await List.findByID(listID, connection);

            if (!foundList instanceof List || !foundList.isValid()) {
                return [false, {statusCode: 404, message: "Could not find this list"}];
            }

            const newListSorting = new ListSorting(sortingSetTo, foundList);

            if (!newListSorting.isValid()) {
                return [false, {statusCode: 400, message: "Invalid list sorting"}];
            }

            await newListSorting.save(connection);
        } catch (error) {
            console.error(error);
            return [false, {statusCode: 500, message: "Oups! Something went wrong!"}];
        }

        return [true, null];
    });

    if (!success) {
        return next(error);
    }

    const successMessage = "Updated sorting options sucessfully";
    res.send({
        type: "SUCCESS",
        message: successMessage
    })
}));

/*
Post route to add and delete custom columns
*/
router.post("/lists/:listID/custom-columns", 
    checkListAuth, 
    isCustomColumnsLimitMiddleware,
    trimColumns,
    checkForDuplicate, 
    retrievePreviousColumns,
    checkForDuplicateWithCurrentColumns,
    listColumnsValidation(),
    wrapAsync(async (req, res) => {
        const { listID } = req.params;
        let { newColumns } = req.body;

        if (!newColumns || !newColumns.length) {
            const message = "No column(s) to add";
            req.flash("success", message);
            return res.set("Content-type", "application/json")
                .send({ type: "SUCCESS", message })
        }

        await existingOrNewConnection(null, async function(connection) {
            const parentList = 
                newColumns.length ? await List.findByID(listID, connection) : null;

            for (let column of newColumns) {
                const newColumn = new ListColumnType(column.name, column.type, parentList);
                await newColumn.save(connection);
            }
        });

        const message = "Successfully added new columns!";
        req.flash("success", message);
        res.set("Content-type", "application/json")
            .send({ type: "SUCCESS", message});
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
        .send({ type: "SUCCESS", message: `Successfully delete column ${customColumn.name}!` })
}));

router.put("/lists/:listID/custom-column", 
    checkListAuth,
    validateUpdateColumn(),
    wrapAsync(async function(req, res, next) {
    
    const { customColumn } = req.body;

    const [success, error] = await existingOrNewConnection(null, async function(connection) {
        let foundListColumnType;
        try {
            foundListColumnType = await ListColumnType.findByID(customColumn.id, connection);
        } catch (error) {
            return [false, {statusCode: 400, message: "Invalid List Column ID"}];
        }

        if (!foundListColumnType instanceof ListColumnType || !foundListColumnType.isValid()) {
            return [false, {statusCode: 400, message: "Invalid List Column ID"}];
        }

        foundListColumnType.name = customColumn.name;

        try {
            await foundListColumnType.save(connection);
        } catch (error) {
            return [false, {statusCode: 500, message: "Failed to update list column"}];
        }

        return [true, null];
    });

    if (!success) {
        next(error);
    }

    res.set("Content-type", "application/json")
        .send({ type: "SUCCESS", message: `Successfully updated column ${customColumn.name}`});
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
router.post("/lists", 
    checkCollectionAuth, 
    isListMaxLimitMiddleware,
    validation.item({ name: true }), 
    wrapAsync(async (req, res) => {
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
router.delete("/lists/:listID", checkListAuth, isUserPasswordValid, wrapAsync(async (req, res, next) => {
    const paramListID = bigint.toBigInt(req.params.listID);
    const listID = bigint.toBigInt(req.body.listID);

    if (!bigint.isValid(listID) || listID <= 0 ||
        !bigint.isValid(paramListID) || listID !== paramListID) {
        return res.set("Content-type", "application/json")
            .status(400)
            .send({
                type: "ERROR",
                message: "Invalid list id!"
            });
    }

    const [success, error] = await existingOrNewConnection(undefined, async function(connection) {
        try {
            await deleteList(listID, connection);
        } catch (error) {
            return [false, { statusCode: 500, message: `Failed to delete list: ${error.message}` }];
        }

        return [true, null];
    });

    if (!success) {
        return next(error);
    }

    const successMessage = "Succesfully deleted this list!";

    req.flash("success", successMessage);
    res.set("Content-type", "application/json")
        .send({
            type: "SUCCESS",
            message: successMessage        
        });
}));

router.use(parseCelebrateError);
router.use(returnHasJSONIfNeeded);
router.use(errorsWithPossibleRedirect("Cannot find this list"));

module.exports = router;
