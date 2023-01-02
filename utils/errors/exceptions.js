/*
A bunch of class exceptions to help sort the exceptions thrown
*/

/*
Thrown when a error happen to a sql query or connection
*/
class SqlError extends Error {
    constructor(message) {
        super();
        this.statusCode = 500;
        this.message = message;
        this.name = "SqlError";
    }
}

module.exports = {
    SqlError
}