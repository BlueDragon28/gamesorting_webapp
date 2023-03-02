const { Collection } = require("../../models/collections");
const { List } = require("../../models/lists");
const { Item } = require("../../models/items");
const { ListColumnType } = require("../../models/listColumnsType");
const { User } = require("../../models/users");
const { LimitError } = require("../errors/exceptions");
const wrapAsync = require("../errors/wrapAsync");
const { existingOrNewConnection } = require("../sql/sql");

const COLLECTION_LIMIT = 5;
const LIST_LIMIT = 5;
const ITEM_LIMIT = 3000;
const CUSTOM_COLUMNS_LIMIT = 10;

async function getCountAndUserRestriction(req, parent, model, connection) {
    const user = req.session.user;
    return [await model.getCount(parent, connection),
        await User.isBypassingRestriction(user.id, connection)];
}

async function isMaxLimitTemplateMiddleware(req, res, next, parent, model, modelName, limit, connection) {
     const [count, isUserBypassingRestriction] = 
        await existingOrNewConnection(connection, async function(connection) {
            return await getCountAndUserRestriction(req, parent, model, connection)
        }
    );

    if (count >= limit && !isUserBypassingRestriction) {
        throw new LimitError(`You have reached the limit of ${limit} ${modelName}.`)
    }

    next();
}

async function isCollectionMaxLimitMiddleware(req, res, next) {
    await isMaxLimitTemplateMiddleware(
        req, 
        res, 
        next, 
        req.session.user.id, 
        Collection, 
        "collection", 
        COLLECTION_LIMIT
    );
}

async function isListMaxLimitMiddleware(req, res, next) {
    const { collectionID } = req.params;
    await existingOrNewConnection(null, async function(connection) {
        const collection = await Collection.findByID(collectionID, connection)
        await isMaxLimitTemplateMiddleware(
            req, 
            res, 
            next, 
            collection, 
            List, 
            "list", 
            LIST_LIMIT,
            connection
        );
    });
}

async function isItemLaxLimitMiddleware(req, res, next) {
    const { listID } = req.params;
    await existingOrNewConnection(null, async function(connection) {
        const list = await List.findByID(listID, connection);
        await isMaxLimitTemplateMiddleware(
            req, 
            res, 
            next, 
            list, 
            Item, 
            "item", 
            ITEM_LIMIT, 
            connection
        );
    })
}

async function isCustomColumnsLimitMiddleware(req, res, next) {
    const { listID } = req.params;
    const { newColumns } = req.body;

    if (!newColumns || !newColumns.length) {
        return next();
    }

    const [count, isUserBypassingRestriction] =
    await existingOrNewConnection(null, async function(connection) {
        return getCountAndUserRestriction(req, listID, ListColumnType, connection);
    });

    if (newColumns.length + Number(count) > CUSTOM_COLUMNS_LIMIT && !isUserBypassingRestriction) {
        throw new LimitError(`You have reached the limit of ${CUSTOM_COLUMNS_LIMIT} custom columns.`);
    }

    next();
}

module.exports = {
    isCollectionMaxLimitMiddleware: wrapAsync(isCollectionMaxLimitMiddleware),
    isListMaxLimitMiddleware: wrapAsync(isListMaxLimitMiddleware),
    isItemLaxLimitMiddleware: wrapAsync(isItemLaxLimitMiddleware),
    isCustomColumnsLimitMiddleware: wrapAsync(isCustomColumnsLimitMiddleware),
}
