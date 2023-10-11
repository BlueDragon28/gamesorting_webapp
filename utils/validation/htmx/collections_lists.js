const { existingOrNewConnection } = require("../../sql/sql");
const { Collection } = require("../../../models/collections");
const { List } = require("../../../models/lists");
const { User } = require("../../../models/users");
const { sanitizeText } = require("../../../utils/validation/sanitizeText");
const { MAX_NUMBER_OF_LIST_PER_USER, EXTENDED_NUMBER_OF_LIST_PER_USER } = require("./maximumLimitsOfElements");

async function checkIfUserCanCreateMoreLists(userID, connection) {
    const isUserBypassingRestriction = await User.isBypassingRestriction(userID, connection);
    const numberOfLists = await List.getCountFromUser(userID, connection);

    const maximumLimitOfLists = isUserBypassingRestriction ?
        EXTENDED_NUMBER_OF_LIST_PER_USER :
        MAX_NUMBER_OF_LIST_PER_USER;

    if (numberOfLists >= maximumLimitOfLists) {
        return `You cannot created more than ${maximumLimitOfLists} lists`;
    } else {
        return undefined;
    }
}

function validateCollectionListName(collectionListName) {
    let [collectionName,listName] = collectionListName.split("/");
    collectionName = sanitizeText(collectionName?.trim());
    listName = sanitizeText(listName?.trim());

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

    return [
        collectionName, 
        listName, 
        errorMessage,
    ];
}

async function validateAndCreateCollectionsList(userID, collectionName, listName, connection) {
    return await existingOrNewConnection(connection, async function(connection) {
        let errorMessage = undefined;

        errorMessage = await checkIfUserCanCreateMoreLists(userID, connection);

        if (errorMessage) {
            return [errorMessage];
        }

        let collection = await Collection.findByName(userID, collectionName, connection);

        if (!collection) {
            collection = new Collection(userID, collectionName);
            await collection.save(connection);
        }

        let list = await List.findByNameFromCollection(collection, listName, connection);
        if (list != null) {
            errorMessage = `The list ${listName} already exists`;
            return [errorMessage];
        }

        list = new List(listName, collection);

        if (!list.isValid()) {
            errorMessage = "Oups: something went wrong with the list creation";
            return [errorMessage];
        }

        await list.save(connection);

        return [errorMessage, collection, list];
    });
}

async function validateAndUpdateCollectionList(userID, listID, collectionName, listName, connection=null) {
    return await existingOrNewConnection(connection, async function(connection) {
        const list = await List.findByID(listID, connection);
        const collection = list.parentCollection;

        if (collection.userID.toString() !== userID) {
            return ["You do not own this collection/list", list.parentCollection, list];
        }

        if (collectionName === collection.name && listName === list.name) {
            return ["You didn't changed the name", list.parentCollection, list];
        }

        let newCollection = undefined;
        if (collectionName === collection.name) {
            newCollection = collection;
        } else {
            const foundCollection = await Collection.findByName(
                userID, 
                collectionName,
                connection,
            );
            if (!(foundCollection instanceof Collection)) {
                newCollection = new Collection(userID, collectionName);
            } else {
                newCollection = foundCollection;
            }
        }

        if (listName !== list.name) {
            const foundList = await List.findByNameFromCollection(
                newCollection, 
                listName,
                connection,
            );

            if (foundList && foundList instanceof List) {
                return ["List already exists", list.parentCollection, list];
            }
        }

        const newList = list;
        newList.parentCollection = newCollection;
        newList.name = listName;

        if (collection.name !== newCollection.name) {
            await newCollection.save(connection);
        }
        await newList.save(connection);

        if (collection.name !== newCollection.name) {
            await deleteCollectionIfAlone(collection, connection);
        }

        return [null, newCollection, newList];
    });
}

async function deleteCollectionIfAlone(collection, connection) {
    const listsCount = await List.getCount(collection, connection);

    if (listsCount === 0n) {
        await collection.delete(connection);
    }
}

module.exports = {
    validateCollectionListName,
    validateAndCreateCollectionsList,
    validateAndUpdateCollectionList,
};
