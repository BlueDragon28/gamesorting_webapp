const bigint = require("../numbers/bigint");
const { celebrate, Segments } = require("celebrate");
const Joi = require("./extendedJoi");

let usernameValidation = Joi.string().trim().forbidHTML().required();
let emailValidation = Joi.string().trim().email().forbidHTML().required();
let passwordValidation = Joi.string().trim().forbidHTML().required();
let emptyValidation = Joi.string().min(0).max(0).required()

if (process.env.NODE_ENV === "production") {
    usernameValidation = usernameValidation.min(7);
    passwordValidation = passwordValidation.min(7);
}

function checkIfUserValid(user) {
    return  user && bigint.isValid(user.id) && 
            typeof user.username === "string" && user.username.length &&
            typeof user.email === "string" && user.email.length;
}

function makeRegisterUserValidation() {
    return Joi.object({
        username: usernameValidation,
        email: emailValidation,
        password: passwordValidation
    }).required();
}

function makeLoginUserValidation() {
    return Joi.object({
        emptySet: emptyValidation,
        username: usernameValidation,
        password: passwordValidation
    }).required();
}

function makeEmailUpdateValidation() {
    return Joi.object({
        email: emailValidation,
        password: passwordValidation
    }).required();
}

function makePasswordUpdateValidation() {
    return Joi.object({
        currentPassword: passwordValidation,
        newPassword: passwordValidation.invalid(Joi.ref("currentPassword")),
        retypedPassword: passwordValidation.valid(Joi.ref("newPassword"))
    }).required();
}

function makeLostPasswordUpdateValidation() {
    return Joi.object({
        password: passwordValidation,
        retypedPassword: passwordValidation.valid(Joi.ref("password"))
    });
}

function makeDeleteUserValidation() {
    return Joi.object({
        deleteUser: Joi.boolean().invalid(false).sensitive(),
        password: passwordValidation
    });
}

function validateRegisteringUser() {
    const celebrateValidation = {
        [Segments.BODY]: Joi.object({
            user: makeRegisterUserValidation()
        }).required()
    };

    return celebrate(celebrateValidation);
}

function validateLoginUser() {
    const celebrateValidation = {
        [Segments.BODY]: Joi.object({
            user: makeLoginUserValidation()
        }).required()
    };

    return celebrate(celebrateValidation);
}

function validateEmailUpdate() {
    const celebrateValidation = {
        [Segments.BODY]: makeEmailUpdateValidation()
    };

    return celebrate(celebrateValidation);
}

function validatePasswordUpdate() {
    const celebrateValidation = {
        [Segments.BODY]: makePasswordUpdateValidation()
    };

    return celebrate(celebrateValidation);
}

function validateLostPasswordUpdate() {
    const celebrateValidation = {
        [Segments.BODY]: makeLostPasswordUpdateValidation()
    };
    return celebrate(celebrateValidation);
}

function validateDeleteUser() {
    const celebrateValidation = {
        [Segments.BODY]: makeDeleteUserValidation()
    };
    return celebrate(celebrateValidation);
}

module.exports = {
    checkIfUserValid,
    validateRegisteringUser,
    validateLoginUser,
    validateEmailUpdate,
    validatePasswordUpdate,
    validateLostPasswordUpdate,
    validateDeleteUser,
    _: {
        user: makeRegisterUserValidation,
        login: makeLoginUserValidation,
        emailUpdate: makeEmailUpdateValidation,
        passwordUpdate: makePasswordUpdateValidation,
        lostPasswordUpdate: makeLostPasswordUpdateValidation,
        deleteUser: makeDeleteUserValidation
    }
};
