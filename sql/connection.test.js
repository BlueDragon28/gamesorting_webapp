const mariadb = require("./connection");

beforeAll(async function() {
    return mariadb.openPool();
});

test("Check if connection to database is successfull", async function() {
    function testDatabaseConnection(connection) {
        expect(typeof connection?.close).toBe("function");
        expect(typeof connection?.query).toBe("function");
    }

    return mariadb.getConnection(testDatabaseConnection);
});

afterAll(async function() {
    return mariadb.closePool();
});

