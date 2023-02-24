/*
The routes of the collections
*/
const express = require("express");
const { Collection } = require("../models/collections");
const { List } = require("../models/lists");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError, AuthorizationError } = require("../utils/errors/exceptions");
const validation = require("../utils/validation/validation");
const { 
    parseCelebrateError, 
    errorsWithPossibleRedirect, 
    returnHasJSONIfNeeded 
} = require("../utils/errors/celebrateErrorsMiddleware");
const { deleteCollection } = require("../utils/data/deletionHelper");
const { existingOrNewConnection } = require("../utils/sql/sql");
const { isLoggedIn } = require("../utils/users/authentification");
const { checkCollectionAuth } = require("../utils/users/authorization");
const bigint = require("../utils/numbers/bigint");
const Pagination = require("../utils/sql/pagination");

const router = express.Router();

/*
Validate collectionID on each route asking for collection id
*/
router.use("/:collectionID", validation.id);

/*
Check if the user is logged in
*/
router.use(isLoggedIn);

/*
Activate the Collections navlink
*/
router.use(function(req, res, next) {
    res.locals.activeLink = "Collections";
    next();
});

/*
Entry to see the collections list
*/
router.get("/", Pagination.parsePageNumberMiddleware, wrapAsync(async (req, res) => {
    const userID = req.session.user.id;
    const pageNumber = req.query.pn;

    const [collections, pagination] = await Collection.findFromUserID(userID, pageNumber);

    if (!collections || !Array.isArray(collections)) {
        throw new InternalError("Failed To Query Collections");
    }

    res.render("collections/collectionsIndex.ejs", { collections, pagination });
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
router.get("/:collectionID", checkCollectionAuth, Pagination.parsePageNumberMiddleware, wrapAsync(async (req, res) => {
    const { collectionID } = req.params;
    const pageNumber = req.query.pn;

    const collection = await Collection.findByID(collectionID);
    const [lists, pagination] = await List.findFromCollection(collection, pageNumber);

    if (!collection || !collection.isValid()) {
        throw new InternalError(`Failed To Query Collection ${collectionID}`);
    }

    if (!lists || !Array.isArray(lists)) {
        throw new InternalError(`Failed To Query Lists From Collection ${collectionID}`);
    }

    res.render("collections/lists/lists.ejs", { collection, lists, pagination });
}));

/*
Form to edit a collection
*/
router.get("/:collectionID/edit", checkCollectionAuth, wrapAsync(async (req, res) => {
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

    const newCollection = new Collection(req.session.user.id, name);

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
router.put("/:collectionID", checkCollectionAuth, validation.item({ name: true }), wrapAsync(async (req, res) => {
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
router.delete("/:collectionID", checkCollectionAuth, wrapAsync(async (req, res) => {
    const paramsCollectionID = bigint.toBigInt(req.params.collectionID);
    const collectionID = bigint.toBigInt(req.body.collectionID);

    if (!bigint.isValid(collectionID) || collectionID <= 0 ||
        !bigint.isValid(paramsCollectionID) || collectionID !== paramsCollectionID) {
        return res.set("Content-type", "application/json")
            .status(400)
            .send({
                type: "ERROR",
                message: "Invalid Item ID"
            });
    }

    await existingOrNewConnection(undefined, async function(connection) {
        await deleteCollection(collectionID, connection);
    });

    const successMessage = "Successfully deleted a collection"
    req.flash("success", successMessage);
    res.set("Content-type", "application/json")
        .send({
            type: "SUCCESS",
            message: successMessage
        });
}));

/*
Parsing celebrate errors
*/
router.use(parseCelebrateError);
router.use(returnHasJSONIfNeeded);
router.use(errorsWithPossibleRedirect("Cannot find this collection"));

module.exports = router;
