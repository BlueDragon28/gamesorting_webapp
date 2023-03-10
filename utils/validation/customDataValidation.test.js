const { _: validation } = require("./customDataValidation");

const joiObject = validation.columnDataValidation()

it("test valid string custom data", function() {
    let result = joiObject.validate({
        Value: "some value",
        columnType: {
            type: "@String"
        }
    });
    expect(result.error).toBe(undefined);

    result = joiObject.validate({
        Value: "",
        columnType: {
            type: "@String"
        }
    });
    expect(result.error).toBe(undefined);
});

it("test invalid string custom data", function() {
    result = joiObject.validate({
        Value: null,
        columnType: {
            type: "@String"
        }
    });
    expect(result.error).not.toBe(undefined);
});

it("test valid int custom data", function() {
    let result = joiObject.validate({
        Value: 25,
        columnType: {
            type: "@Int",
            min: 0,
            max: 30
        }
    });
    expect(result.error).toBe(undefined);

    result = joiObject.validate({
        Value: 2000,
        columnType: {
            type: "@Int",
            min: -150,
            max: 3000
        }
    });
    expect(result.error).toBe(undefined);
});

it("test invalid int custom data", function() {
    let result = joiObject.validate({
        Value: 25,
        columnType: {
            type: "@Int",
            min: 0,
            max: 5
        }
    });
    expect(result.error).not.toBe(undefined);

    result = joiObject.validate({
        Value: null,
        columnType: {
            type: "@Int",
            min: 0,
            max: 1
        }
    });
    expect(result.error).not.toBe(undefined);

    result = joiObject.validate({
        Value: 0,
        columnType: {
            type: "@Int"
        }
    });
    expect(result.error).not.toBe(undefined);
});

it("test invalid type custom data", function() {
    let result = joiObject.validate({
        Value: "hello world!",
        columnType: {
            type: "@Test"
        }
    });
    expect(result.error).not.toBe(undefined);

    result = joiObject.validate({
        Value: "someTest"
    });
    expect(result.error).not.toBe(undefined);

    result = joiObject.validate({});
    expect(result.error).not.toBe(undefined);
});
