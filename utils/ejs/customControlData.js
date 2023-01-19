/*
Helpers functions to help choose the type of custom input control on the ejs template base on the ListColumnType object
*/

let Types = {
    STRING: "text"
};

function decryptType(type) {
    switch (type) {
    default:
    case "@String":
        return Types.STRING;
    }
}

function getCustomControlType(customColumn) {
    if (!customColumn || !customColumn.Type || !customColumn.Type.type || !customColumn.Type.type.length) {
        console.log(customColumn);
        return "type=\"text\"";
    }

    const controlType = decryptType(customColumn.Type.type);

    let controlOptions = `type="${controlType}" `;

    return controlOptions;
}

module.exports = {
    getCustomControlType
};