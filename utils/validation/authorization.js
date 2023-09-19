const { List } = require("../../models/lists");
const { ListColumnType } = require("../../models/listColumnsType");
const { existingOrNewConnection } = require("../sql/sql");

function isListOwned(foundList, userID) {
    if (typeof userID !== "string") {
        return "Invalid userID";
    }

    if (!foundList || !(foundList instanceof List) || !foundList.isValid()) {
        return "Could not find this list";
    } else if (foundList.parentCollection.userID.toString() !== userID) {
        return "You do not own this list";
    }

    return null;
}

async function checkIfListColumnTypeOwned(userID, listID, listColumnsTypeID, connection) {
    return await existingOrNewConnection(connection, async function(connection) {
        const listColumnType = await ListColumnType.findByID(listColumnsTypeID, connection);

        if (
            !listColumnType || 
            !(listColumnType instanceof ListColumnType) || 
            !listColumnType.isValid()
        ) {
            return ["Could not find the list column type"];
        }

        const foundList = listColumnType.parentList;

        const errorMessage = isListOwned(foundList, userID.toString())
        if (errorMessage) {
            return [errorMessage];
        }

        if (foundList.id.toString() !== listID) {
            return ["The custom columns is not part of this list"];
        }

        return [null, foundList, listColumnType];
    });
}

module.exports = {
    isListOwned,
    checkIfListColumnTypeOwned,
};
