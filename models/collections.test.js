const { Collection } = require("./collections");

test("Create valid collection object", async function() {
    let col = new Collection(1, "A Collection");
    col.id = 1;
    expect(col.isValid()).toBe(true);

    col = new Collection(25, "col");
    col.id = 27;
    expect(col.isValid()).toBe(true);

    col = new Collection(31, "another col");
    expect(col.isValid()).toBe(true);

    col = new Collection(0, "A Collection");
    expect(col.isValid()).toBe(true);
});

test("Create collection object with invalid invalid userID", async function() {
    let col = new Collection(null, "A Collection");
    expect(col.isValid()).toBe(false);

    col = new Collection("invalid", "A Collection");
    expect(col.isValid()).toBe(false);

    col = new Collection(NaN, "A Collection");
    expect(col.isValid()).toBe(false);
});

test("Create collection object with invalid name", async function() {
    let col = new Collection(1, null);
    expect(col.isValid()).toBe(false);

    col = new Collection(1, "");
    expect(col.isValid()).toBe(false);

    col = new Collection(1, "       ");
    expect(col.isValid()).toBe(false);

    col = new Collection(1, 25);
    expect(col.isValid()).toBe(false);
});

test("Create collection object with invalid id", async function() {
    let col = new Collection(1, "collection");
    col.id = "Hello There";
    expect(() => col.isValid()).toThrow();

    col.id = { id: 1 };
    expect(() => col.isValid()).toThrow();

    col.id = true;
    expect(() => col.isValid()).toThrow();

    col.id = false;
    expect(() => col.isValid()).toThrow();
});

