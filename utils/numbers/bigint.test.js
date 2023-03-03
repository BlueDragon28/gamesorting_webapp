const bigint = require("./bigint");

test("Convert integer numbers bigint should work", function() {
    expect(bigint.toBigInt(0)).toBe(0n);
    expect(bigint.toBigInt(2)).toBe(2n);
    expect(bigint.toBigInt(1000)).toBe(1000n);
    expect(bigint.toBigInt(-1)).toBe(-1n);
    expect(bigint.toBigInt(-1000)).toBe(-1000n);
});

test("Convert string numbers to bigint values should work", function() {
    expect(bigint.toBigInt("")).toBe(0n);
    expect(bigint.toBigInt("0")).toBe(0n);
    expect(bigint.toBigInt("2")).toBe(2n);
    expect(bigint.toBigInt("1000")).toBe(1000n);
    expect(bigint.toBigInt("-1")).toBe(-1n);
    expect(bigint.toBigInt("-1000")).toBe(-1000n);
});

test("Convert floating point numbers to bigint values should throw", function() {
    expect(() => bigint.toBigInt(0.5)).toThrow();
    expect(() => bigint.toBigInt(-0.5)).toThrow();
    expect(() => bigint.toBigInt(-103.1)).toThrow();
    expect(() => bigint.toBigInt(105.5)).toThrow();
});

test("Convert NaN to bigint values should throw", function() {
    expect(() => bigint.toBigInt(NaN)).toThrow();
});

test("Convert invalid number string to bigint should throw", function() {
    expect(() => bigint.toBigInt("qqdsqdf")).toThrow();
    expect(() => bigint.toBigInt("1n")).toThrow();
    expect(() => bigint.toBigInt("a")).toThrow();
    expect(() => bigint.toBigInt("123 456")).toThrow();
});

test("Test if bigint are valid", function() {
    expect(bigint.isValid(0n)).toBe(true);
    expect(bigint.isValid(5n)).toBe(true);
    expect(bigint.isValid(-5n)).toBe(true);
    expect(bigint.isValid(1000n)).toBe(true);
    expect(bigint.isValid(-1000n)).toBe(true);
});

test("Test if integer numbers are valid bigint should work", function () {
    expect(bigint.isValid(0)).toBe(true);
    expect(bigint.isValid(5)).toBe(true);
    expect(bigint.isValid(-5)).toBe(true);
    expect(bigint.isValid(1000)).toBe(true);
    expect(bigint.isValid(-1000)).toBe(true);
});

test("Test if string numbers are valid bigint should work", function() {
    expect(bigint.isValid("0")).toBe(true);
    expect(bigint.isValid("5")).toBe(true);
    expect(bigint.isValid("-5")).toBe(true);
    expect(bigint.isValid("1000")).toBe(true);
    expect(bigint.isValid("-1000")).toBe(true);
});

test("Test if NaN is a valid bigint should be false", function() {
    expect(bigint.isValid(NaN)).toBe(false);
});

test("Convert invalid number string to bigint should be false", function() {
    expect(bigint.isValid("qqdsqdf")).toBe(false);
    expect(bigint.isValid("1n")).toBe(false);
    expect(bigint.isValid("a")).toBe(false);
    expect(bigint.isValid("123 456")).toBe(false);
});

