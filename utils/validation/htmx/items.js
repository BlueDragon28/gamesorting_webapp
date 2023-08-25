const { columnDataAndTypeValidation } = require("../customDataValidation");
const Joi = require("../extendedJoi");

const textValidation = Joi.string().sanitize().trim().min(3).max(300).required();
const uriValidation = Joi.alternatives().try(
    Joi.string().sanitize().trim().max(10000).uri({
        scheme: [
            "http",
            "htpps",
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
                customColumn.CustomRowItemsID
            ] = error;
        }
        validatedCustomColumns.push(validatedCustomColumn);
    }
    return validatedCustomColumns;
}

module.exports = {
    validateText,
    validateURL,
    validateStar,
    validateItemHeader,
    validateCustomColumns,
};
