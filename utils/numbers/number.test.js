const { isNumber } = require("./number");

test("Valid number should work", function() {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(5)).toBe(true);
    expect(isNumber(1000)).toBe(true);
    expect(isNumber(5000)).toBe(true);
    expect(isNumber(-1)).toBe(true);
    expect(isNumber(-5)).toBe(true);
    expect(isNumber(-1000)).toBe(true);
    expect(isNumber(-5000)).toBe(true);
});

test("Invalid number should return false", function() {
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber(NaN - NaN)).toBe(false);
});

test("Non number type should return false", function() {
    expect(isNumber("")).toBe(false);
    expect(isNumber(1n)).toBe(false);
    expect(isNumber("dsqlfjlsdf")).toBe(false);
});
