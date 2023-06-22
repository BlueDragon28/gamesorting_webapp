const path = require("path");
const { mkdir, open } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const { v4: uuid } = require("uuid")

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
    fileName;
    fileHandle;
    fileStream;

    constructor() {
        this.fileName = uuid();
        this.filePath = path.join(jsonDir, this.fileName + ".json",);
    }

    async open() {
        await createDirIfNotExisting();
        this.fileHandle = await open(this.filePath, "w", 0o644);
        this.fileStream = this.fileHandle.createWriteStream({encoding: "utf8"});
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

module.exports = {
    FileStream,
    convertToJSON
};
