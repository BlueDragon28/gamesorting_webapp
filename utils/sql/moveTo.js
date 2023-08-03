const { List } = require("../../models/lists");
const { Item } = require("../../models/items");
const { CustomRowsItems } = require("../../models/customUserData");

function findColumnsID(customRow, newColumnsID) {
    const filteredList = 
        newColumnsID.filter(columnID => columnID.fromID === customRow.columnTypeID);
    console.log("newColumnsID", newColumnsID);
    console.log(customRow);
    return filteredList.length ? filteredList[0] : null;
}

async function newCustomRow(item, fromCustomRow, newColumnsID, connection) {
    const newColumnID = findColumnsID(fromCustomRow, newColumnsID);
    if (!newColumnID) {
        console.log("Failed to find new column type");
    }

    const newCustomRow = new CustomRowsItems(
        fromCustomRow.value,
        item.id,
        newColumnID.toID
    );
    await newCustomRow.save(connection);
}

async function moveItemTo(fromList, toList, item, newColumnsID, connection) {
    if (!fromList || !fromList instanceof List || !fromList.isValid() ||
            !toList || !toList instanceof List || !toList.isValid() ||
            !item || !item instanceof Item || !item.isValid()) {

        throw new ValueError(400, "Invalid lists/item provided");
    }

    const newItem = new Item(item.name, item.url, toList);
    newItem.rating = item.rating;
    await newItem.save(connection);

    for (const customRow of item.customData) {
        await newCustomRow(newItem, customRow, newColumnsID, connection);
    }
}

module.exports = {
    moveItemTo
};
