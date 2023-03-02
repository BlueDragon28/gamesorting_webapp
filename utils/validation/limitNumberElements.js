const { Collection } = require("../../models/collections");
const { User } = require("../../models/users");
const { LimitError } = require("../errors/exceptions");
const wrapAsync = require("../errors/wrapAsync");
const { existingOrNewConnection } = require("../sql/sql");

const COLLECTION_LIMIT = 5;

async function isCollectionMaxLimitMiddleware(req, res, next) {
    const user = req.session.user;
    const [collectionCount, isUserBypassingRestriction] = 
        await existingOrNewConnection(null, async function(connection) {
            return [await Collection.getCount(user.id, connection),
                await User.isBypassingRestriction(user.id, connection)];
        }
    );

    if (collectionCount >= COLLECTION_LIMIT && !isUserBypassingRestriction) {
        throw new LimitError(`You have reached the limit of ${COLLECTION_LIMIT} collections.`)
    }

    next();
}

module.exports = {
    isCollectionMaxLimitMiddleware: wrapAsync(isCollectionMaxLimitMiddleware),
}
