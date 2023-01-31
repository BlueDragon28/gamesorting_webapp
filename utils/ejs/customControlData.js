/*
Helpers functions to help choose the type of custom input control on the ejs template base on the ListColumnType object
*/

let Types = {
    STRING: "text",
    INT: "number"
};

function decryptType(type) {
    switch (type) {
    default:
    case "@String":
        return Types.STRING;
    case "@Int":
        return Types.INT;
    }
}

function findCustomColumnFromItem(item, customData) {
    if (!item || !item.customColumns || !item.customColumns.length ||
        !customData || !customData.ListColumnTypeID || !customData.CustomRowItemsID) {
        return null;
    }

    for (let customColumn of item.customColumns) {
        if (customData.ListColumnTypeID === customColumn.ListColumnTypeID) {
            return customColumn;
        }
    }

    return null;
}

function getCustomControlType(customColumn, customData) {
    if (customData && customData.ListColumnTypeID && customData.CustomRowItemsID) {
        // customColumn is holding the item object
        customColumn = findCustomColumnFromItem(customColumn, customData);
    }

    if (!customColumn || !customColumn.type || !customColumn.type.type || !customColumn.type.type.length) {
        return "type=\"text\"";
    }

    const controlType = decryptType(customColumn.type.type);

    let controlOptions = `type="${controlType}"`;

    switch (controlType) {
    case Types.INT: {
        const { min, max } = customColumn.type
        if (min && typeof min === "number") {
            controlOptions += ` min="${min}"`;
        }

        if (max && typeof max === "number") {
            controlOptions += ` max="${max}"`;
        }
    } break;
    }

    return controlOptions;
}

module.exports = {
    getCustomControlType
};
