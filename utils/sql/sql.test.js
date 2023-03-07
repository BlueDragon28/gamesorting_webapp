const mariadb = require("../../sql/connection");
const { sqlString, existingOrNewConnection } = require("./sql");

beforeAll(async function() {
    return mariadb.openPool("_testing");
});

test("Prepare string for sql query", function() {
    expect(sqlString("hello world!")).toBe("hello world!");
    expect(sqlString('"some test with double quote"'))
        .toBe('""some test with double quote""');
    expect(sqlString("\\some test with back slash\\"))
        .toBe("\\\\some test with back slash\\\\");
    expect(sqlString('\\"\\"\\'))
        .toBe('\\\\""\\\\""\\\\');
});

test("Check if new connection is working", async function() {
    function newConnection(connection) {
        expect(typeof connection?.close).toBe("function");
        expect(typeof connection?.query).toBe("function");
    }

    return existingOrNewConnection(null, newConnection);
});

test("Check if existing connection is working", async function() {
    async function returnConnection(connection) {
        return connection;
    }

    const conn = await mariadb.getConnection(returnConnection);
    
    function checkExistingConnection(connection) {
        expect(typeof connection?.close).toBe("function");
        expect(typeof connection?.query).toBe("function");
    }

    return existingOrNewConnection(conn, checkExistingConnection);
});

afterAll(async function() {
    mariadb.closePool();
});
