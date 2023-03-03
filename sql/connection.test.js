const mariadb = require("./connection");

test("Check if connection to database is successfull", async function() {
    function testDatabaseConnection(connection) {
        expect(typeof connection?.close).toBe("function");
        expect(typeof connection?.query).toBe("function");
    }

    return mariadb.getConnection(testDatabaseConnection);
});

afterAll(function() {
    mariadb.closePool();
});

