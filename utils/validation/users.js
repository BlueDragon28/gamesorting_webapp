const bigint = require("../numbers/bigint");
const { celebrate, Joi, Segments } = require("celebrate");

let usernameValidation = Joi.string().trim().required();
let emailValidation = Joi.string().trim().email().required();
let passwordValidation = Joi.string().trim().required();

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
        username: usernameValidation,
        password: passwordValidation
    }).required();
}

function makeEmailUpdateValidation() {
    return Joi.object({
        email: emailValidation
    }).required();
}

function makePasswordUpdateValidation() {
    return Joi.object({
        currentPassword: passwordValidation,
        newPassword: passwordValidation.invalid(Joi.ref("currentPassword")),
        retypedPassword: passwordValidation.valid(Joi.ref("newPassword"))
    }).required();
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
        [Segments.BODY]: makeEmailUpdateValidation()
    };

    return celebrate(celebrateValidation);
}

module.exports = {
    checkIfUserValid,
    validateRegisteringUser,
    validateLoginUser,
    validateEmailUpdate,
    validatePasswordUpdate
};
