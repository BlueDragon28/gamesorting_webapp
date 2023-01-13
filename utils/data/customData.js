/*
This function compare the raw customColumn with the available customDatas.
The goal is to add empty customData if there is no value available.
*/
function addEmptyIfNotFound(customDatasList, itemID, customColumn, customDatas) {
    if (!customDatasList || !customColumn || !customDatas) {
        throw new InternalError("Invalid Data");
    }

    for (let customData of customDatas) {
        if (customData.ListColumnTypeID === customColumn.ListColumnTypeID) {
            customDatasList.push(customData);
            return;
        }
    }

    customDatasList.push({
        CustomRowItemsID: -customColumn.ListColumnTypeID,
        ItemID: itemID,
        ListColumnTypeID: customColumn.ListColumnTypeID,
        Value: "",
        ColumnName: customColumn.Name
    });
}

/*
Compare raw customColumns with customData and add empty customData if there is no data
*/
function includeEmpty(itemData) {
    if (!itemData) {
        throw new InternalError("Invalid Item Data");
    }

    const parsedCustomDatas = [];
    for (let customColumn of itemData.customColumns) {
        addEmptyIfNotFound(parsedCustomDatas, itemData.data.ItemID, customColumn, itemData.data.customData);
    }

    itemData.data.customData = parsedCustomDatas;
}

module.exports = {
    includeEmpty
}