const { opendir, stat, rm } = require("fs/promises");
const { existsSync } = require("fs");
const { join } = require("path");

const rootDir = join(__dirname, "../../");
const clientDataDir = join(rootDir, "clientData");

const _1_HOUR_IN_MS = 60 * 60 * 1000;

async function deleteFileIfNeeded(filePath) {
    const now = Date.now();
    const fileStat = await stat(filePath);
    const canBeDeleted = now - fileStat.birthtimeMs > _1_HOUR_IN_MS;
    if (canBeDeleted) {
        await rm(filePath);
    }
}

async function parseDirectory(dirPath) {
    if (!existsSync(dirPath)) return;
    const dir = await opendir(dirPath);
    for await (const dirent of dir) {
        if (dirent.isSymbolicLink()) continue;

        if (dirent.isDirectory()) {
            await parseDirectory(dirent.path);
        } else if (dirent.isFile) {
            await deleteFileIfNeeded(dirent.path);
        }
    }
}

function enableTask() {
    const interval = process.env.NODE_ENV === "production" ?
        1000 * 60 * 60 : // 1 hour
        1000 * 60; // 1 minutes

    const intervalID = setInterval(parseDirectory, interval, clientDataDir);

    return {
        deactivate: () => {
            clearInterval(intervalID);
        }
    }
}

module.exports = enableTask;
