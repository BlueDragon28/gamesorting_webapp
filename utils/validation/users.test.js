const { _: validation } = require("./users");

const joiUser = validation.user();
const joiLogin = validation.login();
const joiEmailUpdate = validation.emailUpdate();
const joiPWUpdate = validation.passwordUpdate();
const joiLostPassword = validation.lostPasswordUpdate();
const joiDeleteUser = validation.deleteUser();

it("test register user", function() {
    let result = joiUser.validate({
        emptySet: "",
        username: "username12345",
        email: "my@email.com",
        password: "12345"
    });
    expect(result.error).toBe(undefined);

    result = joiUser.validate({
        emptySet: "",
        username: "",
        email: "my@email.com",
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);

    result = joiUser.validate({
        emptySet: "",
        username: "username12345",
        email: "",
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);

    result = joiUser.validate({
        emptySet: "",
        username: "username12345",
        email: "my@email.com",
        password: ""
    });
    expect(result.error).not.toBe(undefined);

    result = joiUser.validate({
        emptySet: "",
        username: "username12345",
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);
});

it("test login user", function() {
    let result = joiLogin.validate({
        emptySet: "",
        username: "username123",
        password: "12345"
    });
    expect(result.error).toBe(undefined);

    result = joiLogin.validate({
        emptySet: "",
        username: "",
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);

    result = joiLogin.validate({
        emptySet: "",
        username: "username123",
        password: ""
    });
    expect(result.error).not.toBe(undefined);

    result = joiLogin.validate({
        emptySet: "",
        username: "username123",
    });
    expect(result.error).not.toBe(undefined);
});

it("test email update", function() {
    let result = joiEmailUpdate.validate({
        email: "my@email.com",
        password: "12345"
    });
    expect(result.error).toBe(undefined);

    result = joiLogin.validate({
        email: "",
        password: ""
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

    result = joiLogin.validate({
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);

    result = joiLogin.validate({
        password: null
    });
    expect(result.error).not.toBe(undefined);

    result = joiLogin.validate({
        email: null,
        password: null
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

it("lost password update", function() {
    let result = joiLostPassword.validate({
        password: "12345",
        retypedPassword: "12345"
    });
    expect(result.error).toBe(undefined);

    result = joiLostPassword.validate({
        password: "abcde",
        retypedPassword: "abcde"
    });
    expect(result.error).toBe(undefined);

    result = joiLostPassword.validate({
        password: "12345",
        retypedPassword: "6789"
    });
    expect(result.error).not.toBe(undefined);

    result = joiLostPassword.validate({
        password: "",
        retypedPassword: ""
    });
    expect(result.error).not.toBe(undefined);

    result = joiLostPassword.validate({
        password: null,
        retypedPassword: null
    });
    expect(result.error).not.toBe(undefined);

    result = joiLostPassword.validate({
    });
    expect(result.error).not.toBe(undefined);

    result = joiLostPassword.validate({
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);

    result = joiLostPassword.validate({
        retypedPassword: "12345"
    });
    expect(result.error).not.toBe(undefined);
});

it("test delete user", function() {
    let result = joiDeleteUser.validate({
        deleteUser: true,
        password: "12345"
    });
    expect(result.error).toBe(undefined);

    result = joiDeleteUser.validate({
        deleteUser: false,
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);

    result = joiDeleteUser.validate({
        deleteUser: '12345',
        password: "12345"
    });
    expect(result.error).not.toBe(undefined);

    result = joiDeleteUser.validate({
        deleteUser: true,
        password: true
    });
    expect(result.error).not.toBe(undefined);
});
