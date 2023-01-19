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

function getCustomControlType(customColumn) {
    if (!customColumn || !customColumn.Type || !customColumn.Type.type || !customColumn.Type.type.length) {
        console.log(customColumn);
        return "type=\"text\"";
    }

    const controlType = decryptType(customColumn.Type.type);

    let controlOptions = `type="${controlType}"`;

    switch (controlType) {
    case Types.INT: {
        const { min, max } = customColumn.Type
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