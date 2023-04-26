require("./testingEnv");
const path = require("path");
const loadEnv = require("./loadingEnvVariable");

test("is file based", function() {
    const nonFileBased = "abcdef";
    const fileBased = `FILE:${path.join(__dirname, __filename)}`;

    expect(loadEnv.isFileBased(nonFileBased)).toBe(false);
    expect(loadEnv.isFileBased(fileBased)).toBe(true);
});

test("convert hex to 8bit number", function() {
    const numberList = [255, 43, 26, 128, 86, 156, 54, 0, 18, 99, 253];
    const hexList = "FF2B1A80569C36001263FD";

    const convertedToNumber = loadEnv._.hexTo8bitNumber(hexList);

    let isEqual = true;

    convertedToNumber.forEach((number, index) => {
        if (number !== numberList[index]) {
            isEqual = false;
        }
    });

    expect(isEqual).toBe(true);
});

test("parse invalid line", function() {
    const validLine = "MYVAR=MYVALUE";

    loadEnv._.parseLine(validLine);
    expect(process.env.MYVAR).toBe("MYVALUE");
});