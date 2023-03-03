const { SqlError, ValueError, InternalError, AuthorizationError, LimitError } = require("./exceptions");

test("Check Errors types", function() {
    expect(new SqlError("SQL Error")).toMatchObject({
        message: "SQL Error",
        statusCode: 500,
        name: "SqlError"
    });

    expect(new ValueError(400, "Value Error")).toMatchObject({
        message: "Value Error",
        statusCode: 400,
        name: "ValueError"
    });

    expect(new InternalError("Internal Error")).toMatchObject({
        message: "Internal Error",
        statusCode: 500,
        name: "InternalError"
    });

    expect(new AuthorizationError("Authorization Error")).toMatchObject({
        message: "Authorization Error",
        statusCode: 403,
        name: "AuthorizationError"
    });

    expect(new LimitError("Limit Error")).toMatchObject({
        message: "Limit Error",
        statusCode: 403,
        name: "LimitError"
    });
});
