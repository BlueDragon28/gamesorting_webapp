const { open } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const JSONStream = require("JSONStream");
const { ValueError } = require("../errors/exceptions");
const Joi = require("../validation/extendedJoi");
const { ListColumnType } = require("../../models/listColumnsType");
const { rejects } = require("node:assert");
const { Item } = require("../../models/items");
const { CustomRowsItems } = require("../../models/customUserData");

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
        const foundCustomColumns = await ListColumnType.findByID(item.id, connection);

        if (foundCustomColumns && foundCustomColumns.parentList.id === list.id) {
            validatedCustomColumns.push({...item, realID: item.id});
            continue;
        }

        const customColumnsByName = await ListColumnType.findFromName(item.name, list, connection);

        if (customColumnsByName) {
            validatedCustomColumns.push({...item, realID: customColumnsByName.id});
            continue;
        }

        try {
            const resultItem = await saveCustomColumnsItem(item, list, connection);
            validatedCustomColumns.push(resultItem);
        } catch {}
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

const validateItem = Joi.object({
    id: Joi.number().required(),
    name: Joi.string().trim().max(300, "utf8").forbidHTML().required(),
    url: Joi.alternatives().try(
        Joi.string().trim().max(10000, "utf8").uri({
            scheme: [
                "http",
                "https"
            ],
            allowQuerySquareBrackets: true,
        }).required(),
        Joi.string().trim().max(0).min(0).required()
    ).required(),
    rating: Joi.number().min(0).max(5).required(),
    parentListID: Joi.number(),
    customData: Joi.array().items(Joi.object({
        id: Joi.number().required(),
        value: Joi.string().trim().max(300, "utf8").forbidHTML().required(),
        itemID: Joi.number().required(),
        columnTypeID: Joi.number().required()
    })).required()
}).required();

async function queryOrNull(func) {
    try {
        return func();
    } catch (err) {
        return null;
    }
}

async function saveCustomDataIntoAnItem(item, savedItem, list, customColumns, connection) {
    const customDatas = item.customData;

    for (const customData of customDatas) {
        const headerCustomColumn = customColumns.find(row => row.id === customData.columnTypeID);

        if (!headerCustomColumn) {
            continue;
        }

        let savedCustomColumn = savedItem.customData?.find(row => row.columnTypeID == headerCustomColumn.realID);

        if (!savedCustomColumn) {
            savedCustomColumn = new CustomRowsItems(undefined, savedItem.id, headerCustomColumn.realID);
        }

        savedCustomColumn.value = customData.value;

        try {
            await savedCustomColumn.save(connection);
        } catch {}
    }
}

async function validateItemsAndSaveThem(item, list, customColumns, connection) {
    let savedItem;

    if (item.id <= 0) {
        savedItem = new Item(item.name, item.url, list);
        savedItem.rating = item.rating;
        try {
            await savedItem.save(connection);
        } catch {
            return;
        }
    } else {
        const foundItemByID = await queryOrNull(() => Item.findByID(item.id, connection));

        if (foundItemByID && foundItemByID.parentList.id === list.id) {
            savedItem = foundItemByID;
        } else {
            const foundItemByName = await queryOrNull(() => Item.findFromName(item.name, list, connection));
            if (foundItemByName) {
                savedItem = foundItemByName;
            } else {
                savedItem = new Item(item.name, item.url, list);
                savedItem.rating = item.rating;
                try {
                    await savedItem.save(connection);
                } catch {
                    return;
                }
            }
        }
    }

    if (!savedItem) return;

    await saveCustomDataIntoAnItem(item, savedItem, list, customColumns, connection);
}

function findItemsAndValidateThem(filePath, list, customColumns, connection) {
    return new Promise((resolve, reject) => {
        open(filePath)
            .then(fileHandle => {
                const fileStream = fileHandle.createReadStream({encoding: "utf8"});
                const jsonStream = fileStream.pipe(JSONStream.parse("items.*"));

                const awaitHandles = [];

                jsonStream.on("data", function(data) {
                    awaitHandles.push((async () => {
                        const result = validateItem.validate(data);
                        if (result.error) {
                            return;
                        }
                        await validateItemsAndSaveThem(result.value, list, customColumns, connection);
                    })());
                });
                jsonStream.on("error", function() {
                    reject(new ValueError(400, "Failed to parse stream"));
                    fileStream.close();
                    fileHandle.close();
                });
                jsonStream.on("end", function() {
                    fileStream.close();
                    fileHandle.close();

                    (async () => {
                        for (const awaitItem of awaitHandles) {
                            await awaitItem;
                        }
                        console.log("finishing!");
                    })()
                        .then(() => resolve());
                });
            });
    });
}

module.exports = {
    findListInfo,
    findCustomColumnsAndValidateThem,
    findItemsAndValidateThem
};
