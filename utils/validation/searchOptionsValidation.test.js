const { searchValidation } = require("./searchOptionsValidation")._;

it("test valid options", function() {
    let testObject = {};
    let result = searchValidation.validate(testObject);
    expect(result.error).toBe(undefined);
    
    testObject = {
        sm: true,
        sm: false,
        st: "hello"
    };
    result = searchValidation.validate(testObject);
    expect(result.error).toBe(undefined);

    testObject = {
        sm: "true",
        sr: "false",
        st: "hello test"
    };
    result = searchValidation.validate(testObject);
    expect(result.error).toBe(undefined);
});

it("test invalid options", function() {
    let testObject = {
        sm: "hello thre",
        sr: "hdlhsdqf",
        st: true
    };
    let result = searchValidation.validate(testObject);
    expect(result.error).not.toBe(undefined);
});
