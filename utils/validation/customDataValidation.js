/*
This module is doing all the custom data validation
*/

const { celebrate, Joi, Segments } = require("celebrate");
const customDataModel = require("../../models/customUserData");
const mariadb = require("../../sql/connection");
const { ValueError, InternalError } = require("../errors/exceptions");
const wrapAsync = require("../errors/wrapAsync");

async function getType(customColumns) {   
    if (!customColumns || !Array.isArray(customColumns)) {
        throw new ValueError(400, "Invalid Custom Data Value");
    }

    return await mariadb.getConnection(async function(connection) {
        for (let customColumn of customColumns) {
            if (!customColumn && ((!customColumn.ListColumnTypeID || !customColumn.CustomRowItemsID) &&
                !customColumn.Value)) {
                throw new ValueError(400, "Invalid Custom Data Value");
            }

            let columnType = [];

            if (customColumn.ListColumnTypeID) {
                columnType = await customDataModel.getColumnTypeFromID(connection, customColumn.ListColumnTypeID);
            } else if (customColumn.CustomRowItemsID){
                columnType = await customDataModel.getColumnTypeFromRowID(connection, customColumn.CustomRowItemsID);
            } else {
                throw new ValueError(400, "Invalid Custom Data Value");
            }

            customColumn.columnType = columnType;
        }

        return customColumns;
    });
}

/*
Validate the custom data with a column type of string
*/
function makeCustomDataStringValidation() {
    return Joi.object({
        Value: Joi.alternatives().try(
            Joi.string().trim().max(300, "utf8").min(1, "utf8"),
            Joi.string().trim().min(0).max(0)
        ),
        columnType: Joi.object({
            type: Joi.string().pattern(/@String/).required()
        }).unknown().required()
    }).unknown().required();
}

/*
Validate the custom data with a column type of int
*/
function makeCustomDataNumberValidation() {
    return Joi.object({
        Value: Joi.alternatives().try(
            Joi.number().min(Joi.ref("columnType.min")).max(Joi.ref("columnType.max")),
            Joi.string().trim().min(0).max(0)
        ),
        columnType: Joi.object({
            type: Joi.string().pattern(/@Int/).required(),
            min: Joi.number(),
            max: Joi.number()
        }).unknown().required()
    }).unknown().required();
}

function columnDataAndTypeValidation() {
    return Joi.alternatives().try(
        makeCustomDataStringValidation(),
        makeCustomDataNumberValidation()
    );
}

function validate() {
    const celebrateValidation = {
        [Segments.BODY]: Joi.object({
            customColumn: Joi.array().items(columnDataAndTypeValidation()) 
        }).unknown().required()
    };

    return celebrate(celebrateValidation);
}

async function parseColumnsType(req, res, next) {
    if (!req.body.customColumns || !Array.isArray(req.body.customColumns)) {
        throw new ValueError(400, "Invalid Custom Data Value");
    }

    const customColumns = await getType(req.body.customColumns);

    if (!customColumns) {
        throw new InternalError("Invalid Custom Columns");
    }

    req.body.customColumn = customColumns;
    console.log(req.body.customColumn)

    next();
}

module.exports = {
    parseColumnsType: wrapAsync(parseColumnsType),
    validate
};
