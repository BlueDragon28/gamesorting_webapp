/*
The routes of the collections
*/
const express = require("express");
const { Collection } = require("../models/collections");
const { List } = require("../models/lists");
const { Item } = require("../models/items");
const { ListColumnType } = require("../models/listColumnsType");
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
const { isLoggedIn, isUserPasswordValid } = require("../utils/users/authentification");
const { checkCollectionAuth } = require("../utils/users/authorization");
const bigint = require("../utils/numbers/bigint");
const Pagination = require("../utils/sql/pagination");
const { isCollectionMaxLimitMiddleware } = require("../utils/validation/limitNumberElements");

const router = express.Router();


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
router.get("/", function(req, res) {
    res.render("collections/collectionsHTMXIndex.ejs");
});

router.get("/collections_lists_list", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { selectedID } = req.query;

    const [lists] = await existingOrNewConnection(null, async function(connection) {
        const lists = await List.findFromUser(userID, connection);
        return [lists];
    });

    res.render("partials/htmx/collections/collections_lists_list", {
        lists,
        selectedID,
    });
}));

router.get("/new", wrapAsync(async function(req, res) {
    const { currentUrl } = req.htmx;

    let returnUrl = currentUrl.substring(
        currentUrl.indexOf("/collections"),
        currentUrl.indexOf("?") !== -1 ?
            currentUrl.indexOf("?") : currentUrl.length
    );

    if (returnUrl === "/collections") {
        returnUrl = "/collections/collections_lists_list";
    }

    res.render("partials/htmx/collections/new_collection_list_form", {
        returnUrl
    });
}));

router.get("/lists/:listID", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    let { listID } = req.params;
    const onlyItems = req.query.onlyItems === "true" ? true : undefined;
    const onlyList = req.query.onlyList === "true" ? true : undefined;

    if (!req.htmx.isHTMX || req.htmx.isBoosted) {
        return res.render("partials/htmx/collections/collections_lists_selection", {
            originalUrl: req.originalUrl
        });
    }

    const [lists, items] = await existingOrNewConnection(null, async function(connection) {
        let lists = undefined;
        if (!onlyItems) {
            lists = await List.findFromUser(userID, connection);
        }

        const selectedList = await List.findByID(listID, connection);
        let items = [];

        if (selectedList.parentCollection.userID == userID) {
            if (!onlyList) {
                items = (await Item.findFromList(selectedList, undefined, undefined, connection, null))[0];
            }
        } else {
            listID = undefined;
        }
        
        return [lists, items];
    });
    const questionMarkPost = req.originalUrl.indexOf("?");
    const originalUrl = req.originalUrl.substring(
        0, 
        questionMarkPost >= 0 ? questionMarkPost : req.originalUrl.length
    );

    res.render("partials/htmx/collections/collections_lists_selection", {
        lists,
        items,
        listID,
        originalUrl,
        onlyItems,
        onlyList,
    });
}));

router.get("/lists/:listID/item/:itemID", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { listID, itemID } = req.params;
    const { fullPageLoad } = req.query;

    if (req.htmx.isHTMX && fullPageLoad === "true") {
        const [lists, item, listColumnsType] = await existingOrNewConnection(null, async function(connection) {
            const lists = await List.findFromUser(userID, connection);

            const selectedList = await List.findByID(listID, connection);
            if (selectedList.parentCollection.userID != userID) {
                return [lists, null];
            }

            const currentItem = await Item.findByID(itemID, connection);
            if (currentItem.parentList.id !== selectedList.id) {
                return [lists, null];
            }

            const listColumnsType = await ListColumnType.findFromList(currentItem.parentList, connection);

            return [lists, currentItem, listColumnsType];
        });

        return res.render("partials/htmx/collections/items/item", {
            lists,
            item,
            listID,
            listColumnsType,
            fullPageLoad: true,
        });

    } else if (req.htmx.isHTMX && !req.htmx.isBoosted && !fullPageLoad) {
        const [item, listColumnsType] = await existingOrNewConnection(null, async function(connection) {
            const currentItem = await Item.findByID(itemID, connection);
            if (currentItem.parentList.parentCollection.userID != userID) {
                return [null];
            }

            const listColumnsType = await ListColumnType.findFromList(currentItem.parentList, connection);

            return [currentItem, listColumnsType];
        });

        return res.render("partials/htmx/collections/items/item", {
            item,
            listColumnsType,
            fullPageLoad: false,
        });
    } else {
        res.render("partials/htmx/collections/items/item_loadpage", {
            originalUrl: req.originalUrl
        });
    }
}));

router.post("/lists", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { collection_list_name: collectionListName } = req.body;
    let [collectionName,listName] = collectionListName.split("/");
    collectionName = collectionName?.trim();
    listName = listName?.trim();

    let errorMessage = undefined;

    if (typeof collectionListName !== "string" || !collectionListName.length) {
        errorMessage = "You must provide a collection and list name";
    } else if (collectionListName.indexOf("/") === -1) {
        errorMessage = "You must seperate collection and list name with a slash /";
    } else if (collectionListName.indexOf("/") !== collectionListName.lastIndexOf("/")) {
        errorMessage = "You should not put multiple slash /";
    } else if (typeof collectionName !== "string" || !collectionName.length) {
        errorMessage = "You must provide a collection name to the left of the slash /";
    } else if (collectionName.length < 3) {
        errorMessage = "Collection name must be at least 3 characters";
    } else if (typeof listName !== "string" || !listName.length) {
        errorMessage = "You must provide a list name to the right of the slash /";
    } else if (listName.length < 3) {
        errorMessage = "List name must be at least 3 characters";
    }

    if (!errorMessage) {
        await existingOrNewConnection(null, async function(connection) {
            let collection = await Collection.findByName(userID, collectionName, connection);

            if (!collection) {
                collection = new Collection(userID, collectionName);
                await collection.save(connection);
            }

            let list = await List.findByNameFromCollection(collection, listName, connection);
            if (list != null) {
                errorMessage = `The list ${listName} already exists`;
                return;
            }

            list = new List(listName, collection);

            if (!list.isValid()) {
                errorMessage = "Oups: something went wrong with the list creation";
                return;
            }

            await list.save(connection);
        });
    }

    res.render("partials/htmx/collections/new_collection_list_form", {
        errorMessage,
        justValidation: true,
        inputValue: collectionListName,
    });
}));

/*
Validate collectionID on each route asking for collection id
*/
router.use("/:collectionID", validation.id);

// router.get("/", Pagination.parsePageNumberMiddleware, wrapAsync(async (req, res) => {
//     const userID = req.session.user.id;
//     const pageNumber = req.query.pn;
// 
//     const [collections, pagination] = await Collection.findFromUserID(userID, pageNumber);
// 
//     if (!collections || !Array.isArray(collections)) {
//         throw new InternalError("Failed To Query Collections");
//     }
// 
//     res.render("collections/collectionsIndex.ejs", { collections, pagination });
// }));

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
router.post("/", isCollectionMaxLimitMiddleware, validation.item({ name: true }), wrapAsync(async (req, res) => {
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
router.delete("/:collectionID", checkCollectionAuth, isUserPasswordValid, wrapAsync(async (req, res) => {
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
