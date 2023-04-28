const { existsSync, readFileSync } = require("fs");
const { decrypt } = require("./data/encryption").AES_unique;

function isFileBased(varValue) {
    if (typeof varValue !== "string" || !varValue.length) {
        return false;
    }

    return varValue.startsWith("FILE:");
}

function parseLine(line) {
    if (typeof line !== "string" || !line.length) {
        return;
    }

    const [varName, varValue] = line.split("=").map(item => item.trim());

    if (typeof varName !== "string" || typeof varValue !== "string" ||
        !varName.length || !varValue.length) {
        return;
    }

    process.env[varName] = varValue;
}

function loadEnvVariableFromFile(filePath) {
    if (typeof filePath !== "string" || !filePath.length || !existsSync(filePath)) {
        return;
    }

    const fileContent = readFileSync(filePath, { encoding: "utf8" });
    const linesArray = fileContent.split("\n") // Seperate file content in a array on lines
        .map(line => line.trim())
        .filter(line => line.length > 0);

    for (const line of linesArray) {
        parseLine(line);
    }
}

const hexString = "0123456789ABCDEF";
function hexTo8bitNumber(encryptionHex) {
    if (typeof encryptionHex !== "string" || !encryptionHex.length || encryptionHex.length % 2 !== 0) return null;

    const _8bitNumbers = [];

    for (let i = 0; i < encryptionHex.length; i+=2) {
        const twoHex = encryptionHex.substring(i, i+2);
        let _8bitNumber = 0;

        for (let j = 0; j < 2; j++) {
            const hexCharacter = twoHex[j].toUpperCase();
            let number = hexString.indexOf(hexCharacter);

            if (number === -1) return null;

            if (j === 0) number = number << 4;

            _8bitNumber = _8bitNumber | number;
        }

        _8bitNumbers.push(_8bitNumber);
    }

    return _8bitNumbers;
}

function readKeyFile(filePath) {
    if (typeof filePath !== "string" || !filePath.length) {
        return null;
    }

    const data = readFileSync(filePath, {encoding: "utf8"}).split("\n")[0];
    const encryptionHex = data;

    if (typeof encryptionHex !== "string" || !encryptionHex.length) return null;

    return hexTo8bitNumber(encryptionHex);
}

function readEncryptedFile(filesPath) {
    const [encryptedFilePath, encryptionKeyFilePath] =
        filesPath.split(";");

    if (typeof encryptedFilePath !== "string" || typeof encryptionKeyFilePath !== "string" ||
        !encryptedFilePath.length || !encryptionKeyFilePath.length) {

        return null;
    }

    const encryptionKey = readKeyFile(encryptionKeyFilePath);

    if (encryptionKey === null || !encryptionKey?.length) return null;

    const encryptedFileData = readFileSync(encryptedFilePath);

    if (!encryptedFileData.length) return null;

    const decryptedFile = decrypt(encryptedFileData.toString("hex"), encryptionKey);

    if (typeof decryptedFile !== "string" || !decryptedFile.length) return null;

    return decryptedFile;
}

const unencryptedFileRegEx = /^FILE:[A-Za-z0-9/\._\-]+$/
const encryptedFileRegEx = /^FILE:[A-Za-z0-9/\._\-]+;[A-Za-z0-9/\._\-]+$/;

function getEnvValueFromFile(envValue) {
    if (typeof envValue !== "string" || !envValue.length) {
        return null;
    }

    if (unencryptedFileRegEx.test(envValue)) {
        const [,filePath] = envValue.split(":");

        if (!existsSync(filePath)) {
            return null;
        }

        const data = readFileSync(filePath, {encoding: "utf8"});
        return data;
    } else if (encryptedFileRegEx.test(envValue)) {
        const [,filesPath] = envValue.split(":");
        return readEncryptedFile(filesPath);
    } else {
        return null;
    }
}

module.exports = {
    isFileBased,
    loadEnvVariableFromFile,
    getEnvValueFromFile,
    _: {
        parseLine,
        hexTo8bitNumber
    }
}