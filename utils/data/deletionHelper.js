const { CustomRowsItems } = require("../../models/customUserData");
const { Item } = require("../../models/items");
const { ListColumnType } = require("../../models/listColumnsType");
const { List } = require("../../models/lists");
const { Collection } = require("../../models/collections");
const bigint = require("../numbers/bigint");

async function deleteCustomDatasFromItemID(itemID, connection) {
    if (!bigint.isValid(itemID)) {
        return;
    }

    const customDatas = await CustomRowsItems.findFromItem(itemID, connection);

    for (let customData of customDatas) {
        if (!customData || !customData instanceof CustomRowsItems || !customData.isValid()) {
            continue;
        }

        await customData.delete(connection);
    }
}

async function deleteItem(itemID, connection) {
    if (!bigint.isValid(itemID)) {
        return;
    }

    const foundItem = await Item.findByID(itemID, connection);

    if (!foundItem || !foundItem instanceof Item || !foundItem.isValid()) {
        return;
    }

    await deleteCustomDatasFromItemID(foundItem.id, connection);

    await Item.deleteFromID(foundItem.id, connection);
}

async function deleteItemsFromList(list, connection) {
    if (!list || !list instanceof List || !list.isValid()) {
        return;
    }

    const items = await Item.findFromList(list, connection);
    for (let item of items) {
        await deleteItem(item.id, connection);
    }
}

async function deleteListColumnsType(listID, connection) {
    if (!bigint.isValid(listID)) {
        return;
    }

    await ListColumnType.deleteFromList(listID, connection);
}

async function deleteList(listID, connection) {
    if (!bigint.isValid(listID)) {
        return;
    }

    const foundList = await List.findByID(listID, connection);

    if (!foundList || !foundList instanceof List || !foundList.isValid()) {
        return;
    }

    await deleteListColumnsType(foundList.id, connection)
    await deleteItemsFromList(foundList, connection)
    await List.deleteFromID(foundList.id, connection);
}

async function deleteLists(collection, connection) {
    if (!collection || !collection instanceof Collection || !collection.isValid()) {
        return;
    }

    const lists = await List.findFromCollection(collection, connection);

    for (let list of lists) {
        await deleteList(list.id, connection);
    }
}

async function deleteCollection(collectionID, connection) {
    if (!bigint.isValid(collectionID)) {
        return;
    }

    const foundCollection = await Collection.findByID(collectionID, connection);

    await deleteLists(foundCollection, connection);

    await Collection.deleteFromID(foundCollection.id, connection);
}

module.exports = {
    deleteCustomDatasFromItemID,
    deleteItem,
    deleteList,
    deleteCollection
};
