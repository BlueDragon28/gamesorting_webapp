const path = require("path");
const { mkdir, open, rm } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const { v4: uuid } = require("uuid")
const { List } = require("../../models/lists");
const { ListColumnType } = require("../../models/listColumnsType");
const { Item } = require("../../models/items");
const { CustomRowsItems } = require("../../models/customUserData");
const Pagination = require("../sql/pagination");

const rootDir = path.join(__dirname, "../../");
const dataDir = path.join(rootDir, "clientData");
const jsonDir = path.join(dataDir, "jsonData");

async function createDirIfNotExisting() {
    if (!existsSync(jsonDir)) {
        await mkdir(jsonDir, { recursive: true });
    }
}

class FileStream {
    filePath;
    fileDir;
    fileName;
    fileHandle;
    fileStream;

    constructor(prefix = "") {
        if (!prefix || typeof prefix !== "string") {
            prefix = "";
        }

        prefix = prefix.trim();

        if (prefix.length) {
            prefix += "-";
        }

        this.fileName = prefix + uuid() + ".json";
        this.filePath = path.join(jsonDir, this.fileName);
        this.fileDir = jsonDir;
    }

    async open() {
        await createDirIfNotExisting();
        this.fileHandle = await open(this.filePath, "w", 0o644);
        this.fileStream = this.fileHandle.createWriteStream({encoding: "utf8"});
    }

    delete() {
        return rm(this.filePath);
    }

    write(str) {
        const promise = new Promise((resolve, reject) => {
            this.#_write(str, () => {
                resolve();
            });
        });
        return promise;
    }

    #_write(str, callback) {
        if (!this.fileStream.write(str, "utf8")) {
            this.fileStream.once("drain", callback);
        } else {
            process.nextTick(callback);
        }
    }

    close() {
        if (!this.fileStream) return;
        this.fileStream.end();
        return new Promise((resolve, reject) => {
            this.fileStream.on("finish", () => {
                resolve();
            });
        });
    }
}

function convertToJSON(obj) {
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === "bigint") {
            return value.toString();
        } else {
            return value;
        }
    });
}

function updateJsonIdentation(jsonIdentation, level) {
    jsonIdentation.level = level;
    jsonIdentation.text = "\n";
    for (let i = 0; i < jsonIdentation.level; i++) {
        jsonIdentation.text += "  ";
    }
}

function identString(str, jsonIdentation) {
    if (jsonIdentation.isMinimized) {
        return str;
    }

    return str.split("").reduce((accumulator, currentValue) => {
        if (jsonIdentation.isInsideDoubleQuote) {
            if (currentValue === '"') {
                jsonIdentation.isInsideDoubleQuote = false;
            }
        } else if ("{[".indexOf(currentValue) >= 0) {
            updateJsonIdentation(jsonIdentation, jsonIdentation.level+1);
            return accumulator + currentValue + jsonIdentation.text;
        } else if ("}]".indexOf(currentValue) >= 0) {
            updateJsonIdentation(jsonIdentation, jsonIdentation.level-1);
            return accumulator + jsonIdentation.text + currentValue;
        } else if (currentValue === ",") {
            return accumulator + currentValue + jsonIdentation.text;
        } else if (currentValue === '"') {
            jsonIdentation.isInsideDoubleQuote = true;
        } else if (currentValue === ":") {
            return accumulator + currentValue + " ";
        }

        return accumulator + currentValue;
    }, "");
}

async function getListHeaderData(listID, connection) {
    const foundList = await List.findByID(listID, connection);

    if (!foundList instanceof List || !foundList.isValid()) {
        throw new Error("Invalid list");
    }

    const foundListColumnType = await ListColumnType.findFromList(foundList, connection);
    return [foundList, foundListColumnType];
}

async function writeListHeaderData(fileStream, data, jsonIdentation) {
    const { list: foundList, columnType: foundListColumnType } = data;

    const listStr = '{"list":' + convertToJSON(foundList.toBaseObject());
    await fileStream.write(identString(listStr, jsonIdentation));

    const listColumnTypeStr = ',"customColumnsType":[' + foundListColumnType.reduce((accumulator, currentValue) => {
        return accumulator + (accumulator.length > 0 ? "," : "") + convertToJSON(currentValue.toBaseObject());
    }, "") + "],";
    await fileStream.write(identString(listColumnTypeStr, jsonIdentation));
}

async function writeItemsIntoJSON(fileStream, list, connection, jsonIdentation, searchOptions) {
    const itemsCount = await Item.getCount(list, connection, searchOptions);
    const numberOfPages = Math.ceil(Number(itemsCount) / Pagination.ITEM_PER_PAGES);

    await fileStream.write(identString('"items":[', jsonIdentation));
    for (let i = 0; i < numberOfPages; i++) {
        const pageNumber = i+1;
        const foundItems = (await Item.findFromList(list, pageNumber, null, connection, searchOptions))[0];
        for (const item of foundItems) {
            item.customData = await CustomRowsItems.findFromItem(item.id, connection);
        }

        const itemsStr = (i > 0 ? "," : "") + 
            foundItems.reduce((accumulator, currentValue) => (
                accumulator + (accumulator.length > 0 ? "," : "") + convertToJSON(currentValue.toBaseObject())
            ), "");
        await fileStream.write(identString(itemsStr, jsonIdentation));
    }
    await fileStream.write(identString("]}", jsonIdentation));
}

module.exports = {
    FileStream,
    getListHeaderData,
    writeListHeaderData,
    writeItemsIntoJSON
};
