const Joi = require("../extendedJoi");
const { 
    textValidation, 
    uriValidation,
    validateText,
    validateURL,
} = require("./items");

function validateType(name, value) {
    const schema = Joi.object({
        [name]: Joi.any().valid(
            "@String",
            "@Int",
            "@Stars",
            "@Href",
        ).required(),
    }).required();
    const { error, value: validatedValue } = schema.validate({
        [name]: value,
    });
    return [error, validatedValue];
}

function validateMinMax(nameMin, nameMax, min, max) {
    const schema = Joi.object({
        [nameMin]: Joi.number().required(),
        [nameMax]: Joi.number().min(Joi.ref(nameMin)).required(),
    }).required();
    const { error, value: validatedValue } = schema.validate({
        [nameMin]: min.length ? min : -2147483648,
        [nameMax]: max.length ? max : 2147483647,
    });
    return [error, validatedValue];
}

function validateCustomColumn(values, errorMessages) {
    const { name, type, min, max } = values;

    var [error, validatedName] = validateText("Column Name", name);
    if (error) {
        errorMessages.name = error;
    }

    var [error, validatedType] = validateType("Column Type", type);
    if (error) {
        errorMessages.type = error;
    }

    const isInt = type === "@Int";

    var [error, validatedMin, validatedMax] = isInt ?
        validateMinMax("Column Min", "Column Max", min, max) : [];
    if (error) {
        errorMessages.integer = error;
    }

    return [
        error,
        validatedName,
        validatedType,
        validatedMin, 
        validatedMax,
    ];
}

module.exports = {
    validateCustomColumn,
};
