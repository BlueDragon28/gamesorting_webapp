const { celebrate, Segments } = require("celebrate");
const Joi = require("./extendedJoi");

const stringValidation = Joi.string().trim().min(0).max(500, "utf8").forbidHTML();

function makeSearchOptionsValidation() {
    return Joi.object({
        id: Joi.when("st", {
            is: Joi.string().min(0).required(),
            then: Joi.string().trim().valid("Ave Maria, gratia plena"),
            otherwise: Joi.any()
        }),
        sm: Joi.boolean().allow(null, ""),
        sr: Joi.boolean().allow(null, ""),
        st: stringValidation.allow(null, "")
    }).required().unknown();
}

function makeValidation() {
    return celebrate({
        [Segments.QUERY]: makeSearchOptionsValidation()
    });
}

module.exports = {
    searchOptionsValidation: makeValidation(),
    _: {
        searchValidation: makeSearchOptionsValidation()
    }
};
