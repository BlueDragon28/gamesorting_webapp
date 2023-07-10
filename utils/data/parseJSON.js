const { open } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const JSONStream = require("JSONStream");
const { ValueError } = require("../errors/exceptions");
const Joi = require("../validation/extendedJoi");
const { ListColumnType } = require("../../models/listColumnsType");

// Found the list key inside the json file and return it
function findListInfo(filePath) {
    if (!existsSync(filePath)) {
        return null;
    }

    return new Promise((resolve, reject) => {
        open(filePath)
            .then(fileHandle => {
                const fileStream = fileHandle.createReadStream({encoding: "utf8"});

                const jsonStream = fileStream.pipe(JSONStream.parse("list"));

                let foundList = null;

                jsonStream.on("data", function(data) {
                    foundList = data;
                });
                jsonStream.on("error", function() {
                    console.log(error);
                    reject(new ValueError(400, "Failed to parse stream"))
                    fileStream.close();
                    fileHandle.close();
                });
                jsonStream.on("end", function() {
                    if (foundList) {
                        resolve(foundList);
                    } else {
                        reject(new ValueError(400, "Not found list key"));
                    }
                    fileStream.close();
                    fileHandle.close();
                });
            });
    });
}

const validateCustomColumns = Joi.object({
    id: Joi.number(),
    name: Joi.string().trim().min(1, "utf8").max(300, "utf8").forbidHTML().required(),
    type: Joi.alternatives().try(
        Joi.object({
            type: Joi.string().pattern(/^@String|@Stars/).required()
        }),
        Joi.object({
            type: Joi.string().pattern(/^@Int/).required(),
            min: Joi.number().required(),
            max: Joi.number().required()
        })
    ),
    parentListID: Joi.number()
});

async function saveCustomColumnsItem(item, list, connection) {
    const customColumns = new ListColumnType(item.name, item.type, list);
    await customColumns.save(connection);

    return {...item, realID: customColumns.id};
}

async function validateCustomColumnsData(customColumns, list, connection) {
    const validatedCustomColumns = [];

    for (const item of customColumns) {
        if (item.id <= 0) {
            try {
                const resultItem = await saveCustomColumnsItem(item, list, connection);
                validatedCustomColumns.push(resultItem);
            } catch (err) {}
            continue;
        }

        const foundCustomColumns = await ListColumnType.findByID(item.id, connection);

        if (!foundCustomColumns) {
            const foundByName = await ListColumnType.findFromName(item.name, list, connection);

            if (!foundByName) {
                try {
                    const resultItem = await saveCustomColumnsItem(item, list, connection)
                    validatedCustomColumns.push(resultItem);
                } catch (err) {}
            } else {
                validatedCustomColumns.push({...item, realID: foundByName.id});
            }

            continue;
        }

        if (foundCustomColumns.parentList.id === list.id) {
            validatedCustomColumns.push({...item, realID: item.id});
        }
    }

    return validatedCustomColumns;
}

function findCustomColumnsAndValidateThem(filePath, list, connection) {
    return new Promise((resolve, reject) => {
        open(filePath)
            .then(fileHandle => {
                const fileStream = fileHandle.createReadStream({encoding: "utf8"});
                const jsonStream = fileStream.pipe(JSONStream.parse("customColumnsType.*"));

                const customColumns = [];

                jsonStream.on("data", function(data) {
                    const result = validateCustomColumns.validate(data);
                    if (result.error) {
                        return;
                    }

                    const value = result.value;
                    customColumns.push(value);
                });
                jsonStream.on("error", function() {
                    reject(new ValueError(400, "Failed to parse stream"));
                    fileStream.close();
                    fileHandle.close();
                });
                jsonStream.on("end", function() {
                    fileStream.close();
                    fileHandle.close();

                    validateCustomColumnsData(customColumns, list, connection)
                        .then(validatedCustomColumns => {
                            resolve(validatedCustomColumns);
                        })
                        .catch(err => {
                            console.log(err);
                            reject(new ValueError(400, "Invalid custom data value"));
                        });
                });
            });
    });
}

module.exports = {
    findListInfo,
    findCustomColumnsAndValidateThem
};
