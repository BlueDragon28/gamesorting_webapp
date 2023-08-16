const path = require("path");
const { existsSync } = require("fs");
const { opendir, readFile } = require("fs/promises");
const { InternalError } = require("../utils/errors/exceptions");
const { existingOrNewConnection } = require("../utils/sql/sql");

const revisionsDir = path.join(__dirname, "revisions");
const revisionsTableSql = path.join(__dirname, "revisionsTable.sql");

async function getAllSqlFiles(sqlDir) {
    if (!existsSync(sqlDir)) {
        throw new InternalError("Revisions directory do not exists");
    }

    const sqlFiles = [];

    const dir = await opendir(sqlDir);
    for await (const dirent of dir) {
        if (
            dirent.isFile() && 
            path.extname(dirent.name) === ".sql"
        ) {
            sqlFiles.push({
                path: dirent.path,
                name: dirent.name
            });
        }
    }

    return sqlFiles;
}

async function addRevisionsTableIfNotExisting(connection) {
    if (!existsSync(revisionsTableSql)) {
        throw new InternalError("Revisions table creation file do not exists");
    }

    const queryStatement = (await readFile(revisionsTableSql)).toString();
    await connection.query(queryStatement);
}

async function applyRevisionFileIfNotAlreadyApplied(revisionFile, connection) {
    const queryStatement = 
        "SELECT COUNT(1) AS count FROM revisions WHERE FileName = ? LIMIT 1";

    const queryArgs = [
        revisionFile.name
    ];
    
    const queryResult = (await connection.query(queryStatement, queryArgs))[0];
    if (queryResult.count) {
        return;
    }

    const fileStatement = (await readFile(revisionFile.path)).toString();
    await connection.query(fileStatement);

    const applyStatement = 
        "INSERT INTO revisions(FileName) VALUES (?)";
    const applyArgs = [
        revisionFile.name
    ];
    await connection.query(applyStatement, applyArgs);
}

async function applyRevisions() {
    const sqlFiles = await getAllSqlFiles(revisionsDir);
    console.log(sqlFiles.sort((a, b) => 
        a.name < b.name ? -1 : a.name === b.name ? 0 : 1));

    await existingOrNewConnection(null, async function(connection) {
        await addRevisionsTableIfNotExisting(connection);

        for (file of sqlFiles) {
            await applyRevisionFileIfNotAlreadyApplied(file, connection);
        }
    });
}

module.exports = {
    applyRevisions
};
