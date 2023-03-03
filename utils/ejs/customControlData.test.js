const { getCustomControlType } = require("./customControlData");

test("Valid custom column text type, should work", function() {
    expect(getCustomControlType({
        type: {
            type: "@String"
        }
    })).toBe("type=\"text\"");

    expect(getCustomControlType({
        type: {
            type: "@String"
        }
    })).toBe("type=\"text\"");

    expect(getCustomControlType({
        type: {
            type: "@String"
        }
    })).toBe("type=\"text\"");

    expect(getCustomControlType({
        type: {
            type: "@String"
        }
    })).toBe("type=\"text\"");

    expect(getCustomControlType({
        type: {
            type: "@String"
        }
    })).toBe("type=\"text\"");
});

test("Valid custom column int type, should work", function() {
    expect(getCustomControlType({
        type: {
            type: "@Int",
            min: 0,
            max: 5
        }
    })).toBe("type=\"number\" min=\"0\" max=\"5\"");

    expect(getCustomControlType({
        type: {
            type: "@Int",
            min: -100,
            max: 1000
        }
    })).toBe("type=\"number\" min=\"-100\" max=\"1000\"");

    expect(getCustomControlType({
        type: {
            type: "@Int",
            min: 0,
        }
    })).toBe("type=\"number\" min=\"0\"");

    expect(getCustomControlType({
        type: {
            type: "@Int",
            max: 100
        }
    })).toBe("type=\"number\" max=\"100\"");

    expect(getCustomControlType({
        type: {
            type: "@Int",
        }
    })).toBe("type=\"number\"");
});

test("Invalid column type, should return default text type", function() {
    expect(getCustomControlType({})).toBe("type=\"text\"");

    expect(getCustomControlType({
        type: {
            type: "ldsqjfmlqdsf"
        }
    })).toBe("type=\"text\"");

    expect(getCustomControlType({
        type: {
            type: "@int"
        }
    })).toBe("type=\"text\"");
});
