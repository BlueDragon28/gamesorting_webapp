const { existingOrNewConnection } = require("../../sql/sql");
const { Collection } = require("../../../models/collections");
const { List } = require("../../../models/lists");
const { sanitizeText } = require("../../../utils/validation/sanitizeText");

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

module.exports = {
    validateCollectionListName,
    validateAndCreateCollectionsList,
};
