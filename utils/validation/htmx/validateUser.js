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

function validateUpdateUsername(
    username,
    password,
    errorMessages,
) {
    var [error, validatedUsername] = 
        validateItem(usernameValidation, "Username", username);
    if (error) {
        errorMessages.username = error;
    }

    var [error, validatedPassword] =
        validateItem(passwordValidation, "Password", password);
    if (error) {
        errorMessages.password = error;
    }

    return [validatedUsername, validatedPassword];
}

function validateUpdateEmail(
    email,
    password,
    errorMessages,
) {
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

    return [validatedEmail, validatedPassword];
}

function validatedUpdatePassword(
    currentPassword,
    newPassword,
    retypedPassword,
    errorMessages,
) {
    var [error, validatedCurrentPassword] =
        validateItem(passwordValidation, "Current Password", currentPassword);
    if (error) {
        errorMessages.currentPassword = error;
    }

    var [error, validatedNewPassword] =
        validateItem(passwordValidation, "New Password", newPassword);
    if (error) {
        errorMessages.newPassword = error;
    }

    var [error, validatedRetypedPassword] =
        validateItem(passwordValidation, "Retyped Password", retypedPassword);
    if (error) {
        errorMessages.retypedPassword = error;
    }

    if (validatedNewPassword === validatedCurrentPassword && !errorMessages.newPassword) {
        errorMessages.newPassword = "New password cannot be the same as the old one";
    }

    if (validatedRetypedPassword !== validatedNewPassword && !errorMessages.newPassword && !errorMessages.retypedPassword) {
        errorMessages.newPassword = "Password must be the same";
        errorMessages.retypedPassword = "Password must be the same";
    }

    return [
        validatedCurrentPassword,
        validatedNewPassword,
        validatedRetypedPassword,
    ];
}

function validatePassword(
    password,
    errorMessages,
) {
    var [error, validatedPassword] =
        validateItem(passwordValidation, "Password", password);
    if (error) {
        errorMessages.password = error;
    }

    return validatedPassword;
}

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateUpdateUsername,
    validateUpdateEmail,
    validatedUpdatePassword,
    validatePassword
}
