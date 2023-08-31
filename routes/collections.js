/*
The routes of the collections
*/
const express = require("express");
const { Collection } = require("../models/collections");
const { List } = require("../models/lists");
const { Item } = require("../models/items");
const { ListColumnType } = require("../models/listColumnsType");
const wrapAsync = require("../utils/errors/wrapAsync");
const { InternalError, AuthorizationError, ValueError } = require("../utils/errors/exceptions");
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
const { 
    validateCollectionListName,
    validateAndCreateCollectionsList,
    validateAndUpdateCollectionList,
} = require("../utils/validation/htmx/collections_lists");
const { getCustomControlType } = require("../utils/ejs/customControlData");
const { parseCustomColumnsData } = require("../utils/data/listCustomColumnsMiddlewares");
const { 
    validateItemHeader, 
    validateCustomColumns,
    isItemDuplicate,
    saveItem,
} = require("../utils/validation/htmx/items");
const customDataValidation = require("../utils/validation/customDataValidation");

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

router.use(function(req, res, next) {
    res.locals.getCustomControlType = getCustomControlType;
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

router.get("/lists/:listID/edit", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;

    const [errorMessage, list] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        if (!foundList || !foundList instanceof List || !foundList.isValid()) {
            return ["Failed to find this list"];
        } else if (foundList.parentCollection.userID.toString() !== userID) {
            return ["You do not own this list"];
        }

        return [null, foundList];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        res.status(400).send();
    }

    res.render("partials/htmx/collections/new_collection_list_form.ejs", {
        editing: true,
        list,
        returnUrl: `/collections/lists/${list.id}`,
        inputValue: `${list.parentCollection.name}/${list.name}`,
    });
}));

router.get("/lists/:listID/delete-modal", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { listID } = req.params;
    let { destinationId, selectedID } = req.query;

    const [errorMessage, list] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        if (!foundList || !foundList instanceof List || !foundList.isValid()) {
            return ["Could not find this list"];
        } else if (foundList.parentCollection.userID != userID) {
            return ["You do not own this list"];
        } else if (!destinationId || !destinationId?.length) {
            return ["You failed to provide destinationId"];
        }

        return [null, foundList];
    });

    if (!errorMessage) {
        res.render("partials/htmx/modals/deleteListModal.ejs", {
            list,
            destinationId,
            selectedID,
        });
    } else {
        res.render("partials/htmx/modals/errorModal.ejs", {
            errorMessage,
        });
    }
}));

router.get("/lists/:listID/new", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { listID } = req.params;

    const [errorMessage, listColumnsType] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        if (!foundList || !foundList instanceof List || !foundList.isValid()) {
            return ["Could not find this list"];
        } else if (foundList.parentCollection.userID != userID) {
            return ["You do not own this list"];
        }

        const listColumnsType = await ListColumnType.findFromList(foundList, connection);
        return [null, listColumnsType];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.status(500).send();
    }

    res.render("partials/htmx/collections/items/new_item_form.ejs", {
        listID,
        listColumnsType,
    });
}))

router.delete("/lists/:listID", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { listID } = req.params;
    const { selectedID } = req.query;

    const [errorMessage, list, collection] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        if (!foundList || !foundList instanceof List || !foundList.isValid()) {
            return ["Could not find this list"];
        } else if (foundList.parentCollection.userID != userID) {
            return ["You do not own this list"];
        } 

        const parentCollection = foundList.parentCollection;;
        await foundList.delete(connection);
        if (await List.getCount(parentCollection, connection) === 0n) {
            await parentCollection.delete(connection);
        }

        return [null, foundList, parentCollection];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.status(500).send();
    } 

    req.flash("success", `${collection.name}/${list.name} successfully deleted`);

    if (selectedID === list.id.toString()) {
        return res.status(204).set({
            "HX-Location": "/collections",
        }).send();
    }

    res.status(200).send();
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

router.get("/lists/:listID/item/:itemID/delete-modal", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { listID, itemID } = req.params;
    const { destinationId } = req.query;

    const [errorMessage, item] = await existingOrNewConnection(null, async function(connection) {
        const foundItem = await Item.findByID(itemID, connection);

        if (!foundItem || !foundItem instanceof Item || !foundItem.isValid()) {
            return ["Could not find this item"];
        } else if (foundItem.parentList.parentCollection.userID != userID) {
            return ["You do not own this item"];
        } else if (!destinationId) {
            return ["You failed to provide destinationId"];
        }

        return [null, foundItem];
    });

    if (!errorMessage) {
        res.render("partials/htmx/modals/deleteItemModal.ejs", {
            item,
            destinationId,
        });
    } else {
        res.render("partials/htmx/modals/errorModal.ejs", {
            errorMessage
        });
    }
}));

router.get("/lists/:listID/item/:itemID/edit", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID, itemID } = req.params;

    const [
        errorMessage, 
        list, 
        listColumnsType,
        item,
    ] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        if (!foundList || !(foundList instanceof List) || !foundList.isValid()) {
            return ["Could not find this list"];
        } else if (foundList.parentCollection.userID.toString() !== userID) {
            return ["You do not own this list"];
        }

        const listColumnsType = await ListColumnType.findFromList(foundList, connection);

        const foundItem = await Item.findByID(itemID, connection);

        if (!foundItem || !(foundItem instanceof Item) || !foundItem.isValid()) {
            return ["Could not find this item"];
        } else if (foundItem.parentList.id !== foundList.id) {
            return ["This item is not owned by this list"];
        }

        return [
            null, 
            foundList, 
            listColumnsType, 
            foundItem
        ];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.status(500).send();
    }

    const existingValues = {
        name: item.name,
        url: item.url,
        rating: item.rating.toString(),
        customColumns: [],
    };

    res.render("partials/htmx/collections/items/new_item_form.ejs", {
        listID,
        itemID,
        listColumnsType,
        list,
        item,
        editing: true,
        existingValues,
    });
}));

router.post("/lists", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { collection_list_name: collectionListName } = req.body;

    let [
        collectionName,
        listName,
        errorMessage
    ] = validateCollectionListName(collectionListName);

    if (!errorMessage) {
        let [
            validationErrorMessage,
            collection,
            list,
        ] = await validateAndCreateCollectionsList(userID, collectionName, listName);
        errorMessage = validationErrorMessage;

        if (!errorMessage) {
            return res.status(204).set({
                "HX-Location": `{"path":"/collections/lists/${list.id}","target":"#collections-lists-global-row","swap":"outerHTML"}`
            }).send(null);
        }
    }

    res.render("partials/htmx/collections/new_collection_list_form", {
        errorMessage,
        justValidation: true,
        inputValue: collectionListName,
    });
}));

router.post("/lists/:listID", 
    parseCustomColumnsData, 
    customDataValidation.parseColumnsType,
    wrapAsync(async function(req, res) {
        const userID = req.session.user.id;
        const { listID } = req.params;
        const { name, url, rating, customColumns } = req.body;

        const errorMessages = {};

        const [
            validatedName,
            validatedUrl,
            validatedRating,
        ] = validateItemHeader(
            name,
            url,
            rating,
            errorMessages,
        );

        const validatedCustomColumns = validateCustomColumns(customColumns, errorMessages);

        const [returnError, listColumnsType, list] = await existingOrNewConnection(null, async function(connection) {
            const foundList = await List.findByID(listID, connection);

            if (!foundList || !foundList instanceof List || !foundList.isValid()) {
                return ["Failed to retrieve custom columns"];
            } else if (foundList.parentCollection.userID != userID) {
                return ["You do not own this collection"];
            }

            const listColumnsType = await ListColumnType.findFromList(foundList, connection);

            if (Object.keys(errorMessages).length) {
                return [null, listColumnsType];
            }

            const isDuplicate = await isItemDuplicate(
                validatedName.Name,
                foundList,
                connection,
            );

            if (isDuplicate) {
                errorMessages.name = `ValidationError: "${validatedName.Name}" already exists`;
                return [null, listColumnsType];
            }

            const errorMessage = await saveItem(
                validatedName.Name,
                validatedUrl.URL,
                validatedRating.Rating,
                validatedCustomColumns,
                foundList,
                connection
            );

            if (errorMessage) {
                errorMessages.globalError = errorMessage;
                return [null, listColumnsType];
            }

            return [null, listColumnsType, foundList];
        });

        if (returnError) {
            req.flash("error", `ERROR: ${returnError}`);
            return res.status(400).send();
        }

        if (Object.keys(errorMessages).length) {
            return res.render("partials/htmx/collections/items/new_item_form.ejs", {
                listID,
                listColumnsType,
                errorMessages,
                existingValues: {
                    name,
                    url,
                    rating,
                    customColumns,
                }
            });
        } else {
            return res.status(204).set({
                "HX-Location": `{"path":"/collections/lists/${list.id}?onlyItems=true", "target":"#collections-items-list-row","swap":"outerHTML"}`,
            }).send();
        }
    })
);

router.put("/lists/:listID", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;
    const { collection_list_name: collectionListName } = req.body;
    let foundList;

    let [
        collectionName,
        listName,
        errorMessage,
    ] = validateCollectionListName(collectionListName);

    if (!errorMessage) {
        let [
            validationErrorMessage,
            collection,
            list,
        ] = await validateAndUpdateCollectionList(
            userID,
            listID,
            collectionName,
            listName,
        );
        errorMessage = validationErrorMessage;
        foundList = list;

        if (!errorMessage) {
            return res.status(204).set({
                "HX-Location": `{"path":"/collections/lists/${list.id}","target":"#collections-lists-global-row","swap":"outerHTML"}`
            }).send();
        }
    } else {
        await existingOrNewConnection(null, async function(connection) {
            foundList = await List.findByID(userID, connection);
        });
    }

    res.render("partials/htmx/collections/new_collection_list_form", {
        errorMessage,
        justValidation: true,
        inputValue: collectionListName,
        editing: true,
        list: foundList,
    });
}));

router.delete("/lists/:listID/item/:itemID", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID, itemID } = req.params;

    const [errorMessage] = await existingOrNewConnection(null, async function(connection) {
        const foundItem = await Item.findByID(itemID, connection);

        if (!foundItem || !foundItem instanceof Item || !foundItem.isValid()) {
            return ["Item do not exists"];
        } else if (foundItem.parentList.parentCollection.userID.toString() !== userID) {
            return ["You do not own this item"];
        }

        await foundItem.delete(connection);
        return [null];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        res.status(400).send();
    } else {
        res.status(204).set({
            "HX-Location": `{"path":"/collections/lists/${listID}?onlyItems=true","target":"#item-detail-card","swap":"outerHTML"}`
        }).send();
    }
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
