const { celebrate, Joi, Segments } = require("celebrate");

const ColumnType = {
    str: "@String",
    int: "@Int"
}

function makeListColumnValidation() {
    return Joi.object({
        id: Joi.number(),
        name: Joi.string().min(1).required(),
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

function makeListColumnToDeleteValidation() {
    return Joi.object({
        id: Joi.number().greater(0).required()
    }).unknown()
}

function validate() {
    const celebrateValidation = {
        [Segments.BODY]: Joi.object({
            newColumns: Joi.array().items(makeListColumnValidation()),
            columnsToDelete: Joi.array().items(makeListColumnToDeleteValidation())
        }).unknown().required()
    };

    return celebrate(celebrateValidation);
}

module.exports = {
    listColumnsValidation: validate
}
