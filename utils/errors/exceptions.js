/*
A bunch of class exceptions to help sort the exceptions thrown
*/

/*
Thrown when a error happen to a sql query or connection
*/
class SqlError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 500;
        this.name = "SqlError";
    }
}

class ValueError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ValueError";
    }
}

class InternalError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 500;
        this.name = "InternalError";
    }
}

class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 403;
        this.name = "AuthorizationError";
    }
}

class LimitError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 403;
        this.name = "LimitError";
    }
}

module.exports = {
    SqlError,
    ValueError,
    InternalError,
    AuthorizationError,
    LimitError
}
