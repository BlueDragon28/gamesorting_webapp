const { CustomRowsItems } = require("../../models/customUserData");
const { Item } = require("../../models/items");
const { ListSorting } = require("../../models/listSorting");
const { ListColumnType } = require("../../models/listColumnsType");
const { List } = require("../../models/lists");
const { Collection } = require("../../models/collections");
const { User } = require("../../models/users");
const bigint = require("../numbers/bigint");

async function deleteCustomDatas(customDatas, connection) {
  if (!Array.isArray(customDatas)) {
    return;
  }

  for (let customData of customDatas) {
    if (
      !customData | (!customData instanceof CustomRowsItems) ||
      !customData.isValid()
    ) {
      continue;
    }

    await customData.delete(connection);
  }
}

async function deleteCustomDatasFromListColumnType(listColumnID, connection) {
  if (!bigint.isValid(listColumnID)) {
    return;
  }

  const customDatas = await CustomRowsItems.findFromListColumn(
    listColumnID,
    connection
  );

  deleteCustomDatas(customDatas, connection);
}

async function deleteCustomDatasFromItemID(itemID, connection) {
  if (!bigint.isValid(itemID)) {
    return;
  }

  const customDatas = await CustomRowsItems.findFromItem(itemID, connection);

  deleteCustomDatas(customDatas, connection);
}

async function deleteItem(itemID, connection) {
  let foundItem;
  if (!(itemID instanceof Item)) {
    if (!bigint.isValid(itemID)) {
      return;
    }

    foundItem = await Item.findByID(itemID, connection);
  } else {
    foundItem = itemID;
  }

  if (!foundItem || !foundItem instanceof Item || !foundItem.isValid()) {
    return;
  }

  await Item.deleteFromID(foundItem.id, connection);
}

async function deleteListSorting(list, connection) {
  if (!list instanceof List || !list.isValid()) {
    return;
  }

  await ListSorting.deleteFromList(list, connection);
}

async function deleteList(listID, connection) {
  let foundList;
  if (!(listID instanceof List)) {
    if (!bigint.isValid(listID)) {
      return;
    }

    foundList = await List.findByID(listID, connection);
  } else {
    foundList = listID;
  }

  if (!foundList || !foundList instanceof List || !foundList.isValid()) {
    return;
  }

  await List.deleteFromID(foundList.id, connection);
}

async function deleteCollection(collectionID, connection) {
  if (!bigint.isValid(collectionID)) {
    return;
  }

  const foundCollection = await Collection.findByID(collectionID, connection);

  await Collection.deleteFromID(foundCollection.id, connection);
}

async function deleteUser(userID, connection) {
  let foundUser;
  if (!(userID instanceof User)) {
    if (!bigint.isValid(userID)) {
      return;
    }

    foundUser = await User.findByID(userID, connection);
  } else {
    foundUser = userID;
  }

  if (!foundUser || !(foundUser instanceof User) || !foundUser.isValid()) {
    return;
  }

  await foundUser.delete(connection);
}

module.exports = {
  deleteCustomDatasFromListColumnType,
  deleteCustomDatasFromItemID,
  deleteListSorting,
  deleteItem,
  deleteList,
  deleteCollection,
  deleteUser,
};
