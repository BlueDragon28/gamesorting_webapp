const { _: validation } = require("./listColumnsValidation");

const joiObject = validation.columnsValidation();

it("test valid string column", function() {
    let result = joiObject.validate({
        id: 15,
        name: "a name",
        type: {
            type: "@String"
        }
    });
    expect(result.error).toBe(undefined);
});

it("test valid int column", function() {
    let result = joiObject.validate({
        id: -1,
        name: "a name",
        type: {
            type: "@Int",
            min: 0,
            max: 5
        }
    });
    expect(result.error).toBe(undefined);
});

it("test invalid string column", function() {
    let result = joiObject.validate({
        id: 5,
        name: "",
        type: {
            type: "@String"
        }
    });
    expect(result.error).not.toBe(undefined);

    result = joiObject.validate({
        id: 5,
        name: null,
        type: {
            type: "@String"
        }
    });
    expect(result.error).not.toBe(undefined);
});

it("test invalid int column", function() {
    let result = joiObject.validate({
        id: 0,
        name: "a name",
        type: {
            type: "@Int",
            min: 6,
            max: 5
        }
    });
    expect(result.error).not.toBe(undefined);

    result = joiObject.validate({
        id: 0,
        name: "a name",
        type: {
            type: "@Int",
        }
    });
});

it("test invalid column", function() {
    let result = joiObject.validate({
        id: 5,
        name: "a name",
        type: {
            type: "@Type"
        }
    });
    expect(result.error).not.toBe(undefined);

    result = joiObject.validate({
        id: null,
        name: "a name",
        type: {
            type: "@String"
        }
    });
    expect(result.error).not.toBe(undefined);
});
