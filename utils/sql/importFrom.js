const { List } = require("../../models/lists");
const { ListColumnType } = require("../../models/listColumnsType");

/*
Find all the column type from the source list and insert
them into the destination list if they do not already exists
*/

async function importList(toList, columnType, connection) {
    const findColumnFromName = await ListColumnType.findFromName(
        columnType.name,
        toList,
        connection
    );
    if (findColumnFromName) return;

    const newColumn = new ListColumnType(
        columnType.name,
        columnType.type,
        toList
    );
    await newColumn.save(connection);
}

async function importFromList(toListID, fromListID, userID, connection) {
    const toList = await List.findByID(toListID, connection);

    if (!toList || !toList instanceof List || !toList.isValid()) {
        throw new ValueError(404, "List not found");
    }

    const fromList = await List.findByID(fromListID, connection);

    if (
        !fromList || 
        !toList instanceof List || 
        !toList.isValid()
    ) {
        throw new ValueError(404, "Cannot import from an non existing list");
    }

    if (fromList.parentCollection.userID != userID) {
        throw new AuthorizationError("This list is not yours");
    }

    const fromCustomColumns = await ListColumnType.findFromList(fromList, connection);
    
    for (const column of fromCustomColumns) {
        await importList(toList, column, connection);
    }

    return [toList, fromList];
}

module.exports = {
    importFromList
};
