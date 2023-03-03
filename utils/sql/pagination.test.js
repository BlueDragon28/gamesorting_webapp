const Pagination = require("./pagination");

test("Some valid pagination, field isValid should be true", function() {
    expect(new Pagination(0, 1).isValid).toBe(true);
    expect(new Pagination(1, 1).isValid).toBe(true);
    expect(new Pagination(1, 10).isValid).toBe(true);
    expect(new Pagination(1, 15).isValid).toBe(true);
    expect(new Pagination(2, 16).isValid).toBe(true);
    expect(new Pagination(2, 20).isValid).toBe(true);
    expect(new Pagination(3, 31).isValid).toBe(true);
    expect(new Pagination(1, 31).isValid).toBe(true);
    expect(new Pagination(67, 1000).isValid).toBe(true);
    expect(new Pagination(0, 0).isValid).toBe(true);
});

test("Some invalid pagination, field isValid should be false", function() {
    expect(new Pagination(5, 3).isValid).toBe(false);
    expect(new Pagination(5, 5).isValid).toBe(false);
    expect(new Pagination(3, 30).isValid).toBe(false);
});
