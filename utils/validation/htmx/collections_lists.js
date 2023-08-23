function validateCollectionListName(collectionListName) {
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

    return [collectionName, listName, errorMessage];
}

module.exports = {
    validateCollectionListName,
};
