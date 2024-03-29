/*
The routes of the collections
*/
const express = require("express");
const { List } = require("../models/lists");
const { Item } = require("../models/items");
const { ListColumnType } = require("../models/listColumnsType");
const wrapAsync = require("../utils/errors/wrapAsync");
const { 
    htmxErrorsFlashMessage,
} = require("../utils/errors/celebrateErrorsMiddleware");
const { 
    deleteCustomDatasFromListColumnType,
    deleteItem,
    deleteList,
} = require("../utils/data/deletionHelper");
const { existingOrNewConnection } = require("../utils/sql/sql");
const { isLoggedIn } = require("../utils/users/authentification");
const bigint = require("../utils/numbers/bigint");
const { 
    validateCollectionListName,
    validateAndCreateCollectionsList,
    validateAndUpdateCollectionList,
} = require("../utils/validation/htmx/collections_lists");
const {
    validateCustomColumn,
    isColumnDuplicated,
    saveCustomColumn,
    checkIfUserCanCreateMoreCustomColumns,
} = require("../utils/validation/htmx/custom-columns");
const { getCustomControlType } = require("../utils/ejs/customControlData");
const { parseCustomColumnsData } = require("../utils/data/listCustomColumnsMiddlewares");
const { 
    validateItemHeader, 
    validateCustomColumns,
    isItemDuplicate,
    saveItem,
    updateItem,
    checkIfUserCanCreateAnItem,
} = require("../utils/validation/htmx/items");
const customDataValidation = require("../utils/validation/customDataValidation");
const { 
    isListOwned,
    checkIfListColumnTypeOwned,
} = require("../utils/validation/authorization");
const {
    validateText,
} = require("../utils/validation/htmx/items");
const { ListSorting } = require("../models/listSorting");
const { User } = require("../models/users");
const { importFromList } = require("../utils/sql/importFrom");
const { moveItemTo } = require("../utils/sql/moveTo");

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

function parseCurrentPageHeader(req, res, next) {
    const header = req.get("GS-currentPage");
    const itemsHeaderPage = req.get("GS-currentItemsPage");
    try {
        req.currentPageNumber = Math.max(Number(header), 1);
        if (typeof req.currentPageNumber !== "number" || isNaN(req.currentPageNumber)) {
            req.currentPageNumber = 1;
        }
    } catch {
        req.currentPageNumber = 1;
    }
    try {
        req.currentItemsPageNumber = Math.max(Number(itemsHeaderPage), 1);
        if (typeof req.currentItemsPageNumber !== "number" || isNaN(req.currentItemsPageNumber)) {
            req.currentItemsPageNumber = 1;
        }
    } catch {
        req.currentItemsPageNumber = 1;
    }
    next();
}

router.get(
    "/collections_lists_list", 
    parseCurrentPageHeader,
    wrapAsync(async function(req, res) 
{
    const userID = req.session.user.id;
    const { selectedID } = req.query;
    let currentPage = req.currentPageNumber;

    const [lists, pagination] = await existingOrNewConnection(null, async function(connection) {
        const [lists, pagination] = await List.findFromUser(userID, connection, currentPage);
        return [lists, pagination];
    });

    res.render("partials/htmx/collections/collections_lists_list", {
        lists,
        selectedID,
        pagination,
    });
}));

router.get(
    "/new", 
    parseCurrentPageHeader,
    wrapAsync(async function(req, res) 
{
    const { currentUrl } = req.htmx;
    const currentPage = req.currentPageNumber;

    let returnUrl = currentUrl.substring(
        currentUrl.indexOf("/collections"),
        currentUrl.indexOf("?") !== -1 ?
            currentUrl.indexOf("?") : currentUrl.length
    );

    if (returnUrl === "/collections") {
        returnUrl = "/collections/collections_lists_list";
    }

    res.render("partials/htmx/collections/new_collection_list_form", {
        returnUrl,
        currentPage,
    });
}));

router.get(
    "/lists/:listID", 
    parseCurrentPageHeader,
    wrapAsync(async function(req, res) 
{
    const userID = req.session.user.id;
    let { listID } = req.params;
    const onlyItems = req.query.onlyItems === "true" ? true : 
                req.get("GS-onlyItems") === "true" ? true : undefined;
    const onlyList = req.query.onlyList === "true" ? true : undefined;
    const currentPage = req.currentPageNumber;
    const currentItemsPage = req.currentItemsPageNumber;
    const searchTerm = req.get("GS-searchTerm") ?? "";

    if (!req.htmx.isHTMX || req.htmx.isBoosted) {
        return res.render("partials/htmx/collections/collections_lists_selection", {
            originalUrl: req.originalUrl
        });
    }

    const [lists, items, pagination, itemsPagination, listSorting] = await existingOrNewConnection(null, async function(connection) {
        let lists = undefined;
        let pagination = undefined;
        if (!onlyItems) {
            [lists, pagination] = await List.findFromUser(userID, connection, currentPage);
        }

        const selectedList = await List.findByID(listID, connection);
        let items = [];
        let itemsPagination = undefined;
        const foundListSorting = await ListSorting.findByList(selectedList, connection);

        if (selectedList.parentCollection.userID == userID) {

            if (!onlyList) {
                [items, itemsPagination] = await Item.findFromList(
                    selectedList, 
                    currentItemsPage, 
                    foundListSorting, 
                    connection, 
                    {
                        exactMatch: false,
                        regex: false,
                        text: searchTerm,
                    },
                );
            }
        } else {
            listID = undefined;
        }
        
        return [lists, items, pagination, itemsPagination, foundListSorting];
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
        pagination,
        itemsPagination,
        searchTerm,
        listSorting,
    });
}));

router.get(
    "/lists/:listID/edit", 
    parseCurrentPageHeader,
    wrapAsync(async function(req, res) 
{
    const userID = req.session.user.id.toString();
    const { listID } = req.params;
    const currentPage = req.currentPageNumber;

    const [errorMessage, list] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        const errors = isListOwned(foundList, userID);
        if (errors) {
            return [errors];
        }

        return [null, foundList];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    res.render("partials/htmx/collections/new_collection_list_form.ejs", {
        editing: true,
        list,
        returnUrl: `/collections/lists/${list.id}`,
        inputValue: `${list.parentCollection.name}/${list.name}`,
        currentPage,
    });
}));

router.get("/lists/:listID/delete-modal", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { listID } = req.params;
    let { destinationId, selectedID } = req.query;

    const [errorMessage, list] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        const errors = isListOwned(foundList, userID.toString());
        if (errors) {
            return [errors];
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
        req.flash("error", errorMessage);
        res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }
}));

router.get("/lists/:listID/new", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { listID } = req.params;

    const [errorMessage, listColumnsType] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        const errors = isListOwned(foundList, userID.toString());
        if (errors) {
            return [errors];
        }

        const listColumnsType = await ListColumnType.findFromList(foundList, connection);
        return [null, listColumnsType];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    res.render("partials/htmx/collections/items/new_item_form.ejs", {
        listID,
        listColumnsType,
    });
}));

router.get("/lists/:listID/custom-columns", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;
    const { 
        only_custom_columns: onlyCustomColumns,
        onlyList,
        only_inner_custom_columns: onlyInnerCustomColumns,
    } = req.query;

    const questionMarkPos = req.originalUrl.indexOf("?");
    const originalUrl = req.originalUrl.substring(
        0, 
        questionMarkPos >= 0 ? questionMarkPos : req.originalUrl.length
    );

    if (!req.htmx.isHTMX || (req.htmx.isHTMX && req.htmx.isBoosted)) {
        return res.render("partials/htmx/collections/custom_columns/custom_columns_details.ejs", {
            loadingPage: true,
            originalUrl,
        });
    }

    const [
        errorMessage, 
        listColumnsType, 
        lists,
        pagination,
    ] = await existingOrNewConnection(null, async function(connection) {
        const selectedList = await List.findByID(listID, connection);

        let errorMessage = isListOwned(selectedList, userID);
        if (errorMessage) return [errorMessage];

        const listColumnsType = await ListColumnType.findFromList(selectedList, connection);

        let lists = null;
        let pagination = undefined;
        if (onlyCustomColumns !== "true") {
            [lists, pagination] = await List.findFromUser(userID, connection);
        }

        return [null, listColumnsType, lists, pagination];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    res.render("partials/htmx/collections/custom_columns/custom_columns_details.ejs", {
        onlyItems: onlyCustomColumns === "true",
        onlyList: onlyList === "true",
        onlyInnerItems: onlyInnerCustomColumns === "true",
        lists,
        listColumnsType,
        listID,
        pagination,
    });
}));

router.get("/lists/:listID/custom-columns/delete-modal", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;
    const { listColumnsTypeID } = req.query;

    const [errorMessage, list, listColumnType] = 
        await checkIfListColumnTypeOwned(userID, listID, listColumnsTypeID);

    if (!errorMessage) {
        res.render("partials/htmx/modals/deleteListColumnTypeModal.ejs", {
            listColumnType
        })
    } else {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }
}));

router.get("/lists/:listID/custom-columns/edit-form", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;
    const { listColumnsTypeID } = req.query;

    const [errorMessage, list, listColumnType] = 
        await checkIfListColumnTypeOwned(userID, listID, listColumnsTypeID);

    if (!errorMessage) {
        res.render("partials/htmx/collections/custom_columns/partials/update_custom_column_form.ejs", {
            listColumnType,
            selectedID: listID,
            existingName: listColumnType.name,
        });
    } else {
        req.flash("error", errorMessage);
        res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }
}));

router.get("/lists/:listID/custom-columns/new-form", function(req, res) {
    const { listID } = req.params;

    res.render("partials/htmx/collections/custom_columns/partials/custom_column_edit_form.ejs", {
        isValidationPhase: false,
        selectedID: listID,
        isErrors: false,
        errorMessages: {},
        existingFieldsValues: {},
    });
});

router.get("/lists/:listID/custom-columns/import-from-modal", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;
    const isSearchingState = req.get("GS-SearchState") === "true";
    const searchTerm = req.query.search ?? "";

    if (!isSearchingState) {
        return res.render("partials/htmx/modals/modalImportCustomColumnsFrom.ejs", {
            listID,
        });
    }

    const [error, list, searchedLists] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        const error = isListOwned(foundList, userID.toString());
        if (error) {
            return [error];
        }

        const foundUser = await User.findByID(userID, connection);

        if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
            return ["Could not find user"];
        }

        const searchedLists = await List.findAllListFromUserByName(
            foundUser,
            searchTerm,
            foundList,
            connection,
        );

        if (!Array.isArray(searchedLists)) {
            return ["Could not find valid lists"];
        }

        return [null, foundList, searchedLists];
    });

    return res.render("partials/htmx/modals/importCustomColumnsFromInnerModalList.ejs", {
        listID,
        searchedLists,
        isError: error != undefined,
        errorMessage: error,
    });
}));

router.delete("/lists/:listID", wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { listID } = req.params;
    const { selectedID } = req.query;

    const [errorMessage, list, collection] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        const errors = isListOwned(foundList, userID.toString());
        if (errors) {
            return [errors];
        }

        const parentCollection = foundList.parentCollection;;
        await deleteList(foundList, connection);
        if (await List.getCount(parentCollection, connection) === 0n) {
            await parentCollection.delete(connection);
        }

        return [null, foundList, parentCollection];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    } 

    req.flash("success", `${collection.name}/${list.name} successfully deleted`);

    if (selectedID === list.id.toString()) {
        return res.status(204).set({
            "HX-Location": "/collections",
        }).send();
    }

    res.set({
        "HX-Trigger": "new-flash-event",
    }).status(204).send();
}));

router.get("/lists/:listID/item/:itemID", parseCurrentPageHeader, wrapAsync(async function(req, res) {
    const userID = req.session.user.id;
    const { listID, itemID } = req.params;
    const fullPageLoad = req.query.fullPageLoad || req.get("GS-FullPageLoad");
    const currentItemPage = req.currentItemsPageNumber;
    const itemsListSearchTerm = req.get("GS-searchTerm") ?? "";

    if (req.htmx.isHTMX && fullPageLoad === "true") {
        const [lists, item, listColumnsType, pagination] = await existingOrNewConnection(null, async function(connection) {
            const [lists, pagination] = await List.findFromUser(userID, connection);

            const selectedList = await List.findByID(listID, connection);
            if (selectedList.parentCollection.userID != userID) {
                return [lists, null];
            }

            const currentItem = await Item.findByID(itemID, connection);
            if (currentItem.parentList.id !== selectedList.id) {
                return [lists, null];
            }

            const listColumnsType = await ListColumnType.findFromList(currentItem.parentList, connection);

            return [lists, currentItem, listColumnsType, pagination];
        });

        return res.render("partials/htmx/collections/items/item", {
            lists,
            item,
            listID,
            listColumnsType,
            fullPageLoad: true,
            pagination,
            currentItemPage,
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
            currentItemPage,
            itemsListSearchTerm,
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

        if (!foundItem || !(foundItem instanceof Item) || !foundItem.isValid()) {
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
        req.flash("error", errorMessage);
        res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
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

        const errors = isListOwned(foundList, userID);
        if (errors) {
            return [errors];
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
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    const existingValues = {
        name: item.name,
        url: item.url,
        rating: item.rating.toString(),
        customColumns: [],
    };

    for (const columnType of listColumnsType) {
        const customData = item.customData.filter(data => data.columnTypeID === columnType.id)[0];

        if (customData) {
            existingValues.customColumns.push({
                CustomRowItemsID: customData.columnTypeID,
                Value: customData.value,
            });
        }
    }

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

router.get("/lists/:listID/item/:itemID/move-to", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID, itemID } = req.params;
    const isSearchingState = req.get("GS-SearchState") === "true";
    const searchTerm = req.query.search ?? "";

    if (!isSearchingState) {
        return res.render("partials/htmx/modals/modalMoveItemTo.ejs", {
            listID,
            itemID,
        });
    }

    const [error, searchedLists] = await existingOrNewConnection(null, async function(connection) {
        const foundItem = await Item.findByID(itemID, connection);
        const foundList = foundItem.parentList;

        let error = isListOwned(foundList, userID);
        if (error) {
            return [error];
        }

        const foundUser = await User.findByID(userID, connection);

        if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
            return ["Could not find user"];
        }

        const searchedLists = await List.findAllListFromUserByName(
            foundUser,
            searchTerm,
            foundList,
            connection,
        );

        if (!Array.isArray(searchedLists)) {
            return ["Could not find valid lists"];
        }

        return [null, searchedLists];
    });

    res.render("partials/htmx/modals/moveItemToModalList.ejs", {
        listID,
        itemID,
        searchedLists,
        isError: typeof error === "string",
        errorMessage: error,
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

            const errors = isListOwned(foundList, userID.toString());
            if (errors) {
                return [errors];
            }

            const listColumnsType = await ListColumnType.findFromList(foundList, connection);

            const canCreateItemErrorMessage = 
                await checkIfUserCanCreateAnItem(userID, connection);

            if (canCreateItemErrorMessage) {
                errorMessages.globalError = canCreateItemErrorMessage;
                return [null, listColumnsType];
            }

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
            return res.set({
                "HX-Trigger": "new-flash-event",
            }).status(204).send();
        }

        if (Object.keys(errorMessages).length) {
            return res.render("partials/htmx/collections/items/new_item_form.ejs", {
                listID,
                listColumnsType,
                errorMessages,
                justValidation: true,
                existingValues: {
                    name,
                    url,
                    rating,
                    customColumns,
                }
            });
        } else {
            return res.status(204).set({
                "HX-Location": `{"path":"/collections/lists/${list.id}", "target":"#collections-items-list-row","swap":"outerHTML","headers":{"GS-onlyItems":"true"}}`,
            }).send();
        }
    })
);

router.post("/lists/:listID/switch-list-order", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;

    const [errorMessage] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        let errors = isListOwned(foundList, userID);
        if (errors) {
            return [errors];
        }

        let foundListSorting = await ListSorting.findByList(foundList, connection);
        if (!foundListSorting) {
            foundListSorting = new ListSorting("no-order", foundList, true);
        } else {
            foundListSorting.reverseOrder = !foundListSorting.reverseOrder;
        }
        await foundListSorting.save(connection);

        return [null];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    res.set({
        "HX-Trigger": "update-items-list",
    }).status(204).send();
}));

router.post("/lists/:listID/update-list-sorting", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;
    const { listSorting: listSortingType } = req.body;

    const [errorMessage] = await existingOrNewConnection(null, async function(connection) {
        const foundList = await List.findByID(listID, connection);

        let errors = isListOwned(foundList, userID);
        if (errors) {
            return [errors];
        }

        let foundListSorting = await ListSorting.findByList(foundList, connection);
        if (!foundListSorting) {
            foundListSorting = new ListSorting(listSortingType, foundList, false);
        } else {
            foundListSorting.type = listSortingType;
        }
        await foundListSorting.save(connection);
        return [null];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    res.set({
        "HX-Trigger": "update-items-list",
    }).status(204).send();
}));

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

router.post("/lists/:listID/custom-columns", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;
    const { name, type, min, max } = req.body;

    const errorMessages = {};

    const [
        error,
        validatedName,
        validatedType,
        validatedMin,
        validatedMax,
    ] = validateCustomColumn({
        name,
        type,
        min,
        max,
    }, errorMessages);

    const [
        errorMessage,
        listColumnsType,
    ] = await existingOrNewConnection(null, async function(connection) {
        const selectedList = await List.findByID(listID, connection);

        let errorMessage = isListOwned(selectedList, userID);
        if (errorMessage) return [errorMessage];

        errorMessage = await checkIfUserCanCreateMoreCustomColumns(userID, connection);

        if (errorMessage) {
            return [errorMessage];
        }

        const listColumnsType = await ListColumnType.findFromList(
            selectedList, 
            connection
        );

        if (Object.keys(errorMessages).length) {
            return [null, listColumnsType];
        }

        const isDuplicate = await isColumnDuplicated(
            validatedName,
            selectedList,
            connection,
        );

        if (isDuplicate) {
            errorMessages.name = `ValidationError: "${validatedName}" already exists`;
            return [null, listColumnsType];
        }

        errorMessage = await saveCustomColumn(
            validatedName,
            validatedType,
            validatedMin,
            validatedMax,
            selectedList,
            connection,
        );

        if (errorMessage) {
            return [errorMessage];
        }

        return [null, listColumnsType];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    // if (Object.keys(errorMessages).length) {
    if (!Object.keys(errorMessages).length) {
        res.set({
            "HX-Trigger": "update-list-columns-type-list",
        });
    }
    res.render("partials/htmx/collections/custom_columns/partials/details.ejs", {
        isValidation: true,
        selectedID: listID,
        existingValues: {
            name,
            type,
            min,
            max
        },
        errorMessages,
        hasErrors: Object.keys(errorMessages).length > 0,
    });
}));

router.post("/lists/:listID/custom-columns/import-from", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;
    const { "import-from":importFrom } = req.body;

    if (typeof importFrom !== "string" || !importFrom.length) {
        req.flash("error", "You haven't selected a list to import");
        return res.set({
            "HX-Trigger": "new-flash-event, close-import-from-modal",
        }).status(204).send();
    }

    const [error] = await existingOrNewConnection(null, async function(connection) {
        try {
            if (!bigint.isValid(importFrom)) {
                return ["Invalid list"];
            }
        } catch (error) {
            return [error.message];
        }

        try {
            await importFromList(
                listID,
                importFrom,
                BigInt(userID),
                connection,
            );
        } catch (error) {
            return [error.message];
        }

        return [null];
    });

    if (error) {
        req.flash("error", error);
        res.set({
            "HX-Trigger": "new-flash-event, close-import-from-modal, update-list-columns-type-list",
        });
    } else {
        res.set({
            "HX-Trigger": "close-import-from-modal, update-list-columns-type-list",
        });
    }

    res.status(204).send();
}));

router.delete("/lists/:listID/custom-columns", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;
    const { listColumnTypeID } = req.query;

    const [errorMessage, listColumnType] = await existingOrNewConnection(null, async function(connection) {
        const listColumnType = await ListColumnType.findByID(listColumnTypeID, connection);

        if (!listColumnType || !(listColumnType instanceof ListColumnType) || !listColumnType.isValid()) {
            return ["Could not find list column type"];
        }

        const foundList = listColumnType.parentList;
        const errorMessage = isListOwned(foundList, userID);
        if (errorMessage) {
            return [errorMessage];
        }

        if (foundList.id.toString() !== listID) {
            return ["The custom column is not own by this list"];
        }

        await deleteCustomDatasFromListColumnType(listColumnType.id, connection);
        await listColumnType.delete(connection);

        return [null, listColumnType];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    res.status(204).set({
        "HX-Trigger": "update-list-columns-type-list",
    }).send();
}));

router.put("/lists/:listID/custom-columns", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID } = req.params;
    const { listColumnTypeID } = req.query;
    const { name: columnTypeName } = req.body;

    let [validationError, { "Column Name": validatedName }] = 
        validateText("Column Name", columnTypeName);

    const [errorMessage, listColumnType] = await existingOrNewConnection(null, async function(connection) {
        const [errorMessage, foundList, listColumnType] = 
            await checkIfListColumnTypeOwned(userID, listID, listColumnTypeID, connection);

        if (errorMessage) return [errorMessage];

        if (validationError) {
            return [null, listColumnType];
        }

        const isDuplicate = await isColumnDuplicated(
            validatedName,
            foundList,
            connection,
            listColumnType.id,
        );

        if (isDuplicate) {
            validationError = `ValidationError: "${validatedName}" already exists`;
            return [null, listColumnType];
        }

        if (validatedName !== listColumnType.name) {
            listColumnType.name = validatedName;
            await listColumnType.save(connection);
        }

        return [null, listColumnType];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    }

    if (validationError) {
        res.render("partials/htmx/collections/custom_columns/partials/update_custom_column_form.ejs", {
            isValidation: true,
            listColumnType,
            selectedID: listID,
            existingName: columnTypeName,
            nameValidationError: validationError,
        });
    } else {
        res.set({
            "HX-Trigger": "update-list-columns-type-list",
            "HX-Reswap": "outerHTML",
        }).render("partials/htmx/collections/custom_columns/partials/custom_column_edit_form.ejs", {
            isValidationPhase: false,
            selectedID: listID,
            isErrors: false,
            errorMessages: {},
            existingFieldsValues: {},
        });
    }
}));

router.post("/lists/:listID/item/:itemID/move-to", wrapAsync(async function(req, res) {
    const userID = req.session.user.id.toString();
    const { listID, itemID } = req.params;
    const { "make-a-copy":makeACopy, "move-to": moveToListID } = req.body;

    if (typeof moveToListID !== "string" || !moveToListID.length) {
        req.flash("error", "You haven't selected a list");
        return res.set({
            "HX-Trigger": "new-flash-event, close-import-from-modal",
        }).status(204).send();
    }

    const [error, destinationList, newItem] = await existingOrNewConnection(null, async function(connection) {
        try {
            if (!bigint.isValid(moveToListID)) {
                return ["Invalid list"];
            }
        } catch (error) {
            return [error.message];
        }

        const foundItem = await Item.findByID(itemID, connection);

        if (!foundItem || !(foundItem instanceof Item) || !foundItem.isValid()) {
            return ["Could not find item"];
        }

        try {
            const [moveToList, list, newColumnsID] = await importFromList(
                moveToListID,
                listID,
                userID,
                connection,
            );

            const newItem = await moveItemTo(
                list, 
                moveToList,
                foundItem,
                newColumnsID,
                connection,
            );

            if (makeACopy !== "on") {
                await deleteItem(foundItem.id, connection);
            }

            return [null, moveToList, newItem];
        } catch (error) {
            return [error.message];
        }
    });

    if (error) {
        req.flash("error", error);
        return res.set({
            "HX-Trigger": "new-flash-event, close-import-from-modal"
        }).status(204).send();
    }

    res.set({
        "HX-Location": `{"path":"/collections/lists/${destinationList.id}/item/${newItem.id}","target":"#collections-lists-global-row","swap":"outerHTML","headers":{"GS-FullPageLoad":"true"}}`,
        "HX-Trigger": "close-import-from-modal",
    }).status(204).send();
}));

router.put("/lists/:listID/item/:itemID", 
    parseCustomColumnsData,
    customDataValidation.parseColumnsType,
    wrapAsync(async function(req, res) {

        const userID = req.session.user.id.toString();
        const { listID, itemID } = req.params;
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
            errorMessages
        );

        const validatedCustomColumns = validateCustomColumns(
            customColumns,
            errorMessages,
        );

        const [
            returnError, 
            listColumnsType, 
            list, 
            item
        ] = await existingOrNewConnection(null, async function(connection) {
            const foundItem = await Item.findByID(itemID, connection);
            
            if (!foundItem || !(foundItem instanceof Item) || !foundItem.isValid()) {
                return ["Failed to retrieve this item"];
            }

            const foundList = foundItem.parentList;
            
            if (foundList.parentCollection.userID.toString() !== userID) {
                return ["You do not own this item"];
            }

            const listColumnsType = await ListColumnType.findFromList(foundList, connection);

            if (Object.keys(errorMessages).length) {
                return [null, listColumnsType, foundList, foundItem];
            }

            const isDuplicate = await isItemDuplicate(
                validatedName.Name,
                foundList,
                connection,
                foundItem.id,
            );

            if (isDuplicate) {
                errorMessages.name = `ValidationError: "${validatedName.Name}" already exists`;
                return [null, listColumnsType, foundList, foundItem];
            }

            const errorMessage = await updateItem(
                validatedName.Name,
                validatedUrl.URL,
                validatedRating.Rating,
                validatedCustomColumns,
                listColumnsType,
                foundList,
                foundItem,
                connection,
            );

            if (errorMessage) {
                return [errorMessage];
            }

            return [null, listColumnsType, foundList, foundItem];
        });

        if (returnError) {
            req.flash("error", `ERROR: ${returnError}`);
            return res.set({
                "HX-Trigger": "new-flash-event",
            }).status(204).send();
        }

        if (Object.keys(errorMessages).length) {
            return res.render("partials/htmx/collections/items/new_item_form.ejs", {
                listID,
                itemID,
                listColumnsType,
                errorMessages,
                list,
                item,
                editing: true,
                justValidation: true,
                existingValues: {
                    name,
                    url,
                    rating,
                    customColumns,
                },
            });
        } else {
            res.status(204).set({
                "HX-Location": `{"path":"/collections/lists/${list.id}/item/${item.id}","target":"#collections-items-list-row","swap":"outerHTML"}`,
            }).send();
        }
    })
);

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

        await deleteItem(foundItem, connection);
        return [null];
    });

    if (errorMessage) {
        req.flash("error", errorMessage);
        return res.set({
            "HX-Trigger": "new-flash-event",
        }).status(204).send();
    } else {
        res.status(204).set({
            "HX-Location": `{"path":"/collections/lists/${listID}","target":"#item-detail-card","swap":"outerHTML","headers":{"GS-onlyItems":"true"}}`,
        }).send();
    }
}));

router.use(htmxErrorsFlashMessage);

module.exports = router;
