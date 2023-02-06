const { AuthorizationError } = require("../errors/exceptions");
const { Collection } = require("../../models/collections");
const { List } = require("../../models/lists");
const { Item } = require("../../models/items");

const errorMessage = "You Don't Have The Right To Go There!!!";

/*
Check if the user is allowed to access a collection
*/
async function checkCollectionAuth(req, res, next) {
    const { collectionID } = req.params;
    const userID = req.session.user.id;

    const isAuthorized = await Collection.isUserAllowed(userID, collectionID);

    if (!isAuthorized) {
        return next(new AuthorizationError(errorMessage));
    }

    next();
}

/*
Check if the user is allowed to access a list
*/
async function checkListAuth(req, res, next) {
    const { listID } = req.params;
    const userID = req.session.user.id;

    const isAuthorized = await List.isUserAllowed(userID, listID);

    if (!isAuthorized) {
        return next(new AuthorizationError(errorMessage));
    }

    next();
}

/*
Check if the user is allowed to access a item
*/
async function checkItemAuth(req, res, next) {
    const { itemID } = req.params;
    const userID = req.session.user.id;

    const isAuthorized = await Item.isUserAllowed(userID, itemID);

    if (!isAuthorized) {
        return next(new AuthorizationError(errorMessage));
    }

    next();
}

module.exports = {
    checkCollectionAuth,
    checkListAuth,
    checkItemAuth
};
