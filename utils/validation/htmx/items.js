const { columnDataAndTypeValidation } = require("../customDataValidation");
const Joi = require("../extendedJoi");
const { Item } = require("../../../models/items");
const { User } = require("../../../models/users");
const { CustomRowsItems } = require("../../../models/customUserData");
const { EXTENDED_MAX_NUMBER_OF_ITEMS, MAX_NUMBER_OF_ITEMS } = require("./maximumLimitsOfElements");

const textValidation = Joi.string().sanitize().trim().min(3).max(300).required();
const uriValidation = Joi.alternatives().try(
    Joi.string().sanitize().trim().max(10000).uri({
        scheme: [
            "http",
            "https",
        ],
    }).required(),
    Joi.string().trim().max(0).min(0).required(),
).required();

function validateText(name, value) {
    const schema = Joi.object({
        [name]: textValidation,
    }).required();
    const { error, value: validatedValue } = schema.validate({
        [name]: value,
    });
    return [error, validatedValue];
}

function validateURL(name, value) {
    const schema = Joi.object({
        [name]: uriValidation,
    }).required();
    const { error, value: validatedValue } = schema.validate({
        [name]: value,
    });
    return [error, validatedValue];
}

function validateStar(name, value) {
    const schema = Joi.object({
        [name]: Joi.number().min(0).max(5).required(),
    });
    const { error, value: validatedValue } = schema.validate({
        [name]: value,
    });
    return [error, validatedValue];
}

function validateCustomColumn(customColumn) {
    const schema = columnDataAndTypeValidation();
    const { error, value: validatedCustomColumn } = schema.validate(customColumn);
    return [error, validatedCustomColumn];
}

function validateItemHeader(name, url, rating, errorMessages) {
    var [error, validatedName] = validateText("Name", name);
    if (error) {
        errorMessages.name = error;
    }

    var [error, validatedUrl] = validateURL("URL", url);
    if (error) {
        errorMessages.url = error;
    }

    var [error, validatedStar] = validateStar("Rating", rating);
    if (error) {
        errorMessages.rating = error;
    }

    return [
        validatedName,
        validatedUrl,
        validatedStar,
    ];
}

function validateCustomColumns(customColumns, errorMessages) {
    const validatedCustomColumns = [];
    for (let customColumn of customColumns) {
        const [error, validatedCustomColumn] = 
            validateCustomColumn(customColumn);

        if (error) {
            errorMessages[
                customColumn.ListColumnTypeID || 
                customColumn.baseListColumnTypeID ||
                customColumn.CustomRowItemsID
            ] = error;
        }
        validatedCustomColumns.push(validatedCustomColumn);
    }
    return validatedCustomColumns;
}

async function isItemDuplicate(name, list, connection, id=null) {
    const foundItem = await Item.findFromName(name, list, connection);

    if (foundItem instanceof Item) {
        if (typeof id === "bigint" && foundItem.id === id) {
            return false;
        }
        return true;
    }

    return false;
}

async function checkIfUserCanCreateAnItem(userID, connection) {
    const isUserBypassingRestriction = await User.isBypassingRestriction(userID, connection);
    const numberOfItems = await Item.getCountFromUser(userID, connection);

    const maxNumberOfItems = isUserBypassingRestriction ?
        EXTENDED_MAX_NUMBER_OF_ITEMS :
        MAX_NUMBER_OF_ITEMS;

    if (numberOfItems >= maxNumberOfItems) {
        return `You cannot create more than ${maxNumberOfItems} items`;
    } else {
        return undefined;
    }
}

async function saveItem(name, url, rating, customColumns, parentList, connection) {
    const newItem = new Item(name, url, parentList);
    newItem.rating = rating;

    if (!newItem.isValid()) {
        return "Invalid list";
    }

    await newItem.save(connection);

    for (const customColumn of customColumns) {
        const customUserData = new CustomRowsItems(
            customColumn.Value,
            newItem.id,
            customColumn.ListColumnTypeID
        );

        if (customUserData.isValid()) {
            await customUserData.save(connection);
        }
    }

    return null;
}

async function updateItem(
    name, 
    url, 
    rating, 
    customColumns, 
    listColumnsType, 
    parentList, 
    item, 
    connection
) {
    const updatedItem = item;
    updatedItem.name = name;
    updatedItem.url = url;
    updatedItem.rating = rating;

    if (!updatedItem.isValid()) {
        return "Invalid item";
    }

    await updatedItem.save(connection);

    const customData = [];
    for (const columnType of listColumnsType) {
        const foundCustomRow = item.customData.find(row => row.columnTypeID === columnType.id);
        if (foundCustomRow) {
            customData.push(foundCustomRow);
        }
    }

    for (const customColumn of customColumns) {
        let foundCustomData;
        if (customColumn.CustomRowItemsID > 0) {
            foundCustomData = customData.find(data => data.id == customColumn.CustomRowItemsID);
        } else {
            foundCustomData = new CustomRowsItems(undefined, item.id, -customColumn.CustomRowItemsID);
        }

        if (!foundCustomData) {
            continue;
        }

        foundCustomData.value = customColumn.Value.toString();

        if (foundCustomData.isValid()) {
            await foundCustomData.save(connection);
        } else {
            await foundCustomData.delete(connection);
        }
    }

    return null;
}

module.exports = {
    validateText,
    validateURL,
    validateStar,
    validateItemHeader,
    validateCustomColumns,
    isItemDuplicate,
    checkIfUserCanCreateAnItem,
    saveItem,
    updateItem,
    textValidation,
    uriValidation,
};
