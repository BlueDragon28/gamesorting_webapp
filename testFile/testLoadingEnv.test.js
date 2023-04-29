require("../utils/testingEnv");
const { 
    loadEnvVariableFromFile, 
    isFileBased,
    getEnvValueFromFile } = require("../utils/loadingEnvVariable");
const path = require("path");

test("read env file", function() {
    loadEnvVariableFromFile(path.join(__dirname, "env.txt"));

    expect(typeof process.env.MY_VAR1).toBe("string");
    expect(process.env.MY_VAR1).toBe("this is a value!");

    expect(typeof process.env.MY_VAR2).toBe("string");
    expect(process.env.MY_VAR2).toBe("FILE:testFile/valueFile.txt");

    expect(process.env.MY_VAR3).toBe("FILE:testFile/valueFile.enc;testFile/valueFile.key;testFile/valueFile.iv");
});

test("test if MY_VAR2 is file based value", function() {
    expect(isFileBased(process.env.MY_VAR2)).toBe(true);
});

test("read unencrypted value file", function() {
    const myVar = getEnvValueFromFile(process.env.MY_VAR2);

    expect(typeof myVar).toBe("string");
    expect(myVar).toBe("this is a value!");
});

test("read encrypted value file", function() {
    const myVar = getEnvValueFromFile(process.env.MY_VAR3);

    expect(typeof myVar).toBe("string");
    expect(myVar).toBe("this is a value!");
});