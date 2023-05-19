const { celebrate, Segments } = require("celebrate");
const Joi = require("./extendedJoi");

let fromValidation = Joi.string().trim().email().min(1).max(300).forbidHTML().required();
let objectValidation = Joi.string().trim().min(1).max(300).forbidHTML().required();
let messageValidation = Joi.string().trim().min(1).max(5000).forbidHTML().required();

function makeContactMessageValidation() {
    return Joi.object({
        from: fromValidation,
        object: objectValidation,
        message: messageValidation
    }).required();
}

function validateContactMessage() {
    const celebrateValidation = {
        [Segments.BODY]: makeContactMessageValidation()
    };

    return celebrate(celebrateValidation);
}

module.exports = {
    validateContactMessage,
    _: {
        contactMessage: makeContactMessageValidation
    }
};