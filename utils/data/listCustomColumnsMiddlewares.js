const { List } = require("../../models/lists");
const { ListColumnType } = require("../../models/listColumnsType");
const { existingOrNewConnection } = require("../sql/sql");
const bigint = require("../numbers/bigint");
const { sanitizeText } = require("../validation/sanitizeText");

function isUserEnteredTwoColumnWithSameName(newColumns) {
    for (let i = 0; i < newColumns.length; i++) {
        const copyWithouCurrentIndex = newColumns.filter((column, index) => index !== i);

        const filteredList = copyWithouCurrentIndex.filter(column => newColumns[i].name === column.name);
        if (filteredList.length > 0) {
            return true;
        }
    }

    return false;
}

async function checkForDuplicate(req, res, next) {
    const { newColumns } = req.body;

    if (isUserEnteredTwoColumnWithSameName(newColumns)) {
        req.flash("error", "Two Columns Cannot Have The Same Name");
        return res.status(400).send("Two Column Cannot Have The Same Name");
    }

    next();
}

function trimColumns(req, res, next) {
    req.body.newColumns = req.body.newColumns.map(column => ({...column, name: column.name.trim()}));
    next();
}

async function retrievePreviousColumns(req, res, next) {
    const { listID } = req.params;

    const listCustomColumns = await existingOrNewConnection(null, async connection => {
        const list = await List.findByID(listID, connection);
        const listCustomColumns = await ListColumnType.findFromList(list, connection);

        return listCustomColumns;
    });

    req.body.listCustomColumns = listCustomColumns;
    next();
}

async function checkForDuplicateWithCurrentColumns(req, res, next) {
    const { newColumns, listCustomColumns } = req.body;

    for (let column of newColumns) {
        const filteredCustomColumns = 
            listCustomColumns.filter(customColumn => column.name === customColumn.name);
        
        if (filteredCustomColumns.length > 0) {
            req.flash("error", "Two Column Cannot Have The Same Name");
            return res.status(400).send("Two Column Cannot Have The Same Name");
        }
    }

    next();
}

function parseCustomColumnsData(req, res, next) {
    if (!req.body.customColumns) {
        req.body.customColumns = [];
    }

    const customColumnsData = [];

    for (let [strID, value] of Object.entries(req.body.customColumns)) {
        const id = bigint.toBigInt(strID.split("_")[1]);

        if (!bigint.isValid(id)) {
            throw new ValueError(400, "Invalid ListColumnTypeID");
        }

        const columnIDName = req.method === "POST" ? "ListColumnTypeID" : "CustomRowItemsID";

        customColumnsData.push({
            [columnIDName]: id.toString(),
            Value: sanitizeText(value),
        });
    }

    req.body.customColumns = customColumnsData;
    next();
}

module.exports = {
    checkForDuplicate,
    trimColumns,
    retrievePreviousColumns,
    checkForDuplicateWithCurrentColumns,
    parseCustomColumnsData,
}
