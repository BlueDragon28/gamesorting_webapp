const { List } = require("../../models/lists");
const { ListColumnType } = require("../../models/listColumnsType");
const { getCustomColumnsCountAndLimit } = require("../validation/htmx/custom-columns");
const { AuthorizationError } = require("../errors/exceptions");

/*
Find all the column type from the source list and insert
them into the destination list if they do not already exists
*/

async function importList(toList, columnType, connection, newCustomColumnsCallback) {
    const findColumnFromName = await ListColumnType.findFromName(
        columnType.name,
        toList,
        connection
    );
    if (findColumnFromName) return {
        fromID: columnType.id,
        toID: findColumnFromName.id
    };

    const newColumn = new ListColumnType(
        columnType.name,
        columnType.type,
        toList
    );
    await newColumn.save(connection);
    
    if (typeof newCustomColumnsCallback === "function") {
        newCustomColumnsCallback();
    }

    return {
        fromID: columnType.id,
        toID: newColumn.id
    };
}

async function importFromList(toListID, fromListID, userID, connection) {
    const toList = await List.findByID(toListID, connection);

    if (!toList || !(toList instanceof List) || !toList.isValid()) {
        throw new ValueError(404, "List not found");
    }

    const fromList = await List.findByID(fromListID, connection);

    if (
        !fromList || 
        !(toList instanceof List) || 
        !toList.isValid()
    ) {
        throw new ValueError(404, "Cannot import from an non existing list");
    }

    if (
        fromList.parentCollection.userID != userID ||
        toList.parentCollection.userID != userID
    ) {
        throw new AuthorizationError("This list is not yours");
    }

    const fromCustomColumns = await ListColumnType.findFromList(fromList, connection);

    let [customColumnsCount, customColumnsLimit] =
        await getCustomColumnsCountAndLimit(userID, connection);
    
    const newColumnID = []
    for (const column of fromCustomColumns) {
        if (customColumnsCount >= customColumnsLimit) {
            throw new AuthorizationError(`You cannot create more than ${customColumnsLimit} custom columns!`);
        }

        newColumnID.push(await importList(toList, column, connection, () => {
            customColumnsCount++;
        }));
    }

    return [toList, fromList, newColumnID];
}

module.exports = {
    importFromList
};
