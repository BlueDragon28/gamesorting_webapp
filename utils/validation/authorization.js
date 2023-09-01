const { List } = require("../../models/lists");
const { ListColumnType } = require("../../models/listColumnsType");

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

module.exports = {
    isListOwned,
};
