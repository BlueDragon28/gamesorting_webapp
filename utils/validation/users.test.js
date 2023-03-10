const { _: validation } = require("./users");

const joiUser = validation.user();
const joiLogin = validation.login();
const joiEmailUpdate = validation.emailUpdate();
const joiPWUpdate = validation.passwordUpdate();

it("test register user", function() {
    let result = joiUser.validate({
        username: "username12345",
        email: "my@email.com",
        password: "12345"
    });
    expect(result.error).toBe(undefined);

    result = joiUser.validate({
        username: "",
        email: "my@email.com",
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);

    result = joiUser.validate({
        username: "username12345",
        email: "",
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);

    result = joiUser.validate({
        username: "username12345",
        email: "my@email.com",
        password: ""
    });
    expect(result.error).not.toBe(undefined);

    result = joiUser.validate({
        username: "username12345",
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);
});

it("test login user", function() {
    let result = joiLogin.validate({
        username: "username123",
        password: "12345"
    });
    expect(result.error).toBe(undefined);

    result = joiLogin.validate({
        username: "",
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);

    result = joiLogin.validate({
        username: "username123",
        password: ""
    });
    expect(result.error).not.toBe(undefined);

    result = joiLogin.validate({
        username: "username123",
    });
    expect(result.error).not.toBe(undefined);
});

it("test email update", function() {
    let result = joiEmailUpdate.validate({
        email: "my@email.com"
    });
    expect(result.error).toBe(undefined);

    result = joiLogin.validate({
        email: ""
    });
    expect(result.error).not.toBe(undefined);

    result = joiLogin.validate({
        email: "hello there"
    });
    expect(result.error).not.toBe(undefined);

    result = joiLogin.validate({
        email: null
    });
    expect(result.error).not.toBe(undefined);

    result = joiLogin.validate({
    });
    expect(result.error).not.toBe(undefined);
});

it("password update", function() {
    let result = joiPWUpdate.validate({
        currentPassword: "12345",
        newPassword: "123456",
        retypedPassword: "123456"
    });
    expect(result.error).toBe(undefined);

    result = joiPWUpdate.validate({
        currentPassword: "123456",
        newPassword: "123456",
        retypedPassword: "123456"
    });
    expect(result.error).not.toBe(undefined);

    result = joiPWUpdate.validate({
        currentPassword: "12345",
        newPassword: "123456",
        retypedPassword: "1234567"
    });
    expect(result.error).not.toBe(undefined);

    result = joiPWUpdate.validate({
        currentPassword: null,
        newPassword: "123456",
        retypedPassword: "1234567"
    });
    expect(result.error).not.toBe(undefined);

    result = joiPWUpdate.validate({
        newPassword: "123456",
        retypedPassword: "1234567"
    });
    expect(result.error).not.toBe(undefined);
});
