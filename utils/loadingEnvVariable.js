const { existsSync, readFileSync } = require("fs");

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


module.exports = {
    isFileBased,
    loadEnvVariableFromFile
}