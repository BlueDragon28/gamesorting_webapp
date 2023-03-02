const { Collection } = require("../../models/collections");
const { List } = require("../../models/lists");
const { User } = require("../../models/users");
const { LimitError } = require("../errors/exceptions");
const wrapAsync = require("../errors/wrapAsync");
const { existingOrNewConnection } = require("../sql/sql");

const COLLECTION_LIMIT = 5;
const LIST_LIMIT = 5;

async function isMaxLimitTemplateMiddleware(req, res, next, parentID, model, modelName, limit, connection) {
    const user = req.session.user;
     const [count, isUserBypassingRestriction] = 
        await existingOrNewConnection(connection, async function(connection) {
            return [await model.getCount(parentID, connection),
                await User.isBypassingRestriction(user.id, connection)];
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

module.exports = {
    isCollectionMaxLimitMiddleware: wrapAsync(isCollectionMaxLimitMiddleware),
    isListMaxLimitMiddleware: wrapAsync(isListMaxLimitMiddleware),
}
