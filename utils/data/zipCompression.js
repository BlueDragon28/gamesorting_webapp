const { existsSync, createReadStream } = require("node:fs");
const { stat } = require("node:fs/promises")
const { execFile } = require("node:child_process");
const path = require("node:path");
const { InternalError } = require("../errors/exceptions");

const execCommand = "zip";

function compress(workingDir, archiveFilePath, recursive, ...filesToCompress) {
    return new Promise(function(resolve, reject) {
        if (!archiveFilePath || typeof recursive !== "boolean" || !filesToCompress.length || !existsSync(workingDir)) {
            return reject(new Error("Invalid parametters"));
        }

        for (const file of filesToCompress) {
            if (!existsSync(path.join(workingDir, file))) {
                return reject(new Error("Some files do not exists"));
            }
        }

        const args = recursive ?
            ["-r", archiveFilePath, ...filesToCompress] :
            [archiveFilePath, ...filesToCompress];

        execFile(execCommand, args, { cwd: workingDir }, (err, stdout, stderr) => {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
}

async function streamZip(req, res, archivePath, archiveName) {
    if (!existsSync(archivePath)) {
        console.log("failed");
        throw new InternalError("Failed to get file");
    }

    const fileInfo = await stat(archivePath);
    const fileStream = createReadStream(archivePath);

    res.set({
        "Content-Type": "application/zip",
        "Content-Length": fileInfo.size,
        "Content-Range": `bytes 0-${fileInfo.size}/${fileInfo.size}`,
        "Content-Disposition": `attachment; filename="${archiveName}"`
    });

    return new Promise((resolve, reject) => {
        fileStream.pipe(res, {end: false});
        fileStream.on("error", (error) => {
            reject(error);
        });
        fileStream.on("end", () => {
            resolve();
        });
    });
}

module.exports = {
    compressZip: compress,
    streamZip
};
