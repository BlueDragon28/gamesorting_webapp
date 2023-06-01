const { celebrate, Segments } = require("celebrate");
const Joi = require("./extendedJoi");

const ColumnType = {
    str: "@String",
    int: "@Int",
    stars: "@Stars"
}

function makeListColumnValidation() {
    return Joi.object({
        id: Joi.number(),
        name: Joi.string().min(1).forbidHTML().required(),
        type: Joi.object({
            type: Joi.string().valid(...Object.values(ColumnType)).required(),
            min: Joi.when("type", {
                is: Joi.string().valid(ColumnType.int).required(),
                then: Joi.number().required(),
                otherwise: Joi.valid(null)
            }),
            max: Joi.when("type", {
                is: Joi.string().valid(ColumnType.int).required(),
                then: Joi.number().min(Joi.ref("min")).required(),
                otherwise: Joi.valid(null)
            })
        }).required()
    });
}

function validate() {
    const celebrateValidation = {
        [Segments.BODY]: Joi.object({
            newColumns: Joi.array().items(makeListColumnValidation())
        }).unknown().required()
    };

    return celebrate(celebrateValidation);
}

function validateDeleteColumn() {
    const celebrateValidation = {
        [Segments.BODY]: Joi.object({
            customColumn: makeListColumnValidation()
        }).required()
    }

    return celebrate(celebrateValidation);
}

module.exports = {
    listColumnsValidation: validate,
    validateDeleteColumn,
    _: {
        columnsValidation: makeListColumnValidation
    }
}
