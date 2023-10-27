const Joi = require("../extendedJoi");

let usernameValidation = Joi.string().sanitize().trim().max(300).required();
const emailValidation = Joi.string().sanitize().trim().email().max(300).required();
let passwordValidation = Joi.string().sanitize().trim().max(300).required();
const emptyValidation = Joi.string().min(0).max(0).required();

if (process.env.NODE_ENV === "production") {
    usernameValidation = usernameValidation.min(7);
    passwordValidation = passwordValidation.min(7);
}

function validateItem(joiField, name, value) {
    const schema = Joi.object({
        [name]: joiField,
    });
    const { error, value: validatedValue } = schema.validate({
        [name]: value,
    });
    return [error, validatedValue[name]];
}

function validateUserRegistration(
    emptySet,
    username,
    email,
    password,
    retypedPassword,
    errorMessages,
) {
    var [error] =
        validateItem(emptyValidation, "Empty Set", emptySet);
    if (error) {
        errorMessages.global = "Invalid Registering Form";
    }

    var [error, validatedUsername] =
        validateItem(usernameValidation, "Username", username);
    if (error) {
        errorMessages.username = error;
    }

    var [error, validatedEmail] =
        validateItem(emailValidation, "Email", email);
    if (error) {
        errorMessages.email = error;
    }

    var [error, validatedPassword] =
        validateItem(passwordValidation, "Password", password);
    if (error) {
        errorMessages.password = error;
    }

    var [error, validatedRetypedPassword] =
        validateItem(
            Joi.string().valid(validatedPassword),
            "Retyped Password",
            retypedPassword,
        );
    if (error) {
        errorMessages.retypedPassword = "Passwords must be the same";
    }

    return [
        validatedUsername,
        validatedEmail,
        validatedPassword,
        validatedRetypedPassword,
    ];
}

function validateUserLogin(
    emptySet,
    username,
    password,
    errorMessages,
) {
    var [error] =
        validateItem(emptyValidation, "Empty Set", emptySet);
    if (error) {
        errorMessages.global = "Invalid Login Form";
    }

    var [error, validatedUsername] =
        validateItem(usernameValidation, "Username", username);
    if (error) {
        const [emailError, validatedEmail] =
            validateItem(emailValidation, "Email", username);

        if (emailError) {
            errorMessages.username = error;
        } else {
            validatedUsername = validatedEmail;
        }
    }

    var [error, validatedPassword] =
        validateItem(passwordValidation, "Password", password);
    if (error) {
        errorMessages.password = error;
    }

    return [
        validatedUsername,
        validatedPassword,
    ];
}

module.exports = {
    validateUserRegistration,
    validateUserLogin,
}
