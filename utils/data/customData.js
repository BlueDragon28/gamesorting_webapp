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
        CustomRowItemsID: -1n,
        ItemID: itemID,
        ListColumnTypeID: customColumn.ListColumnTypeID,
        Value: "",
        ColumnName: customColumn.Name
    });
}

/*
Make sure the empty customDatas do not have the same negative value
*/
function fillNegativeValue(customDatas) {
    let negativeValue = -1n;
    for (let customData of customDatas) {
        if (customData.CustomRowItemsID === -1n) {
            customData.CustomRowItemsID = negativeValue--;
        }
    }
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

    fillNegativeValue(parsedCustomDatas);

    itemData.data.customData = parsedCustomDatas;
}

module.exports = {
    includeEmpty
}