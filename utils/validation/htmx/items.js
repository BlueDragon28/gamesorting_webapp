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

module.exports = {
    validateText,
    validateURL,
    validateStar,
};
