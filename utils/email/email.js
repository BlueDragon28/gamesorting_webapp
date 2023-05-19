const nodemailer = require("nodemailer");
const { isFileBased, getEnvValueFromFile } = require("../loadingEnvVariable");
const { ValueError, InternalError } = require("../errors/exceptions");

let emailHost;
let emailUser;
let emailPassword;
let emailSender;
let emailAdmin;

if (process.env.NODE_ENV !== "production") {
    emailHost = process.env.EMAIL_HOST;
    emailUser = process.env.EMAIL_USER;
    emailPassword = process.env.EMAIL_PASS;
    emailSender = process.env.EMAIL_SENDER;
    emailAdmin = process.env.EMAIL_ADMIN;
} else {
    emailHost = isFileBased(process.env.EMAIL_HOST) ?
        getEnvValueFromFile(process.env.EMAIL_HOST) :
        process.env.EMAIL_HOST;
    
    emailUser = isFileBased(process.env.EMAIL_USER) ?
        getEnvValueFromFile(process.env.EMAIL_USER) :
        process.env.EMAIL_USER;
    
    emailPassword = isFileBased(process.env.EMAIL_PASS) ?
        getEnvValueFromFile(process.env.EMAIL_PASS) :
        process.env.EMAIL_PASS;
    
    emailSender = isFileBased(process.env.EMAIL_SENDER) ?
        getEnvValueFromFile(process.env.EMAIL_SENDER) :
        process.env.EMAIL_SENDER;
    
    emailAdmin = isFileBased(process.env.EMAIL_ADMIN) ?
        getEnvValueFromFile(process.env.EMAIL_ADMIN) :
        process.env.EMAIL_ADMIN;
}

const transporter = nodemailer.createTransport({
    host: emailHost,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true" ? true : false,
    auth: {
        user: emailUser,
        pass: emailPassword
    }
});

async function sendLostPasswordEmail(to, url) {
    return transporter.sendMail({
        from: `"GameSorting" <${emailSender}>`,
        to,
        subject: "Lost password",
        text: "Click here to reset your password!\nThis link will only be valid for the next 2 hours.\nThis email was sent automatically, do not anwser it.",
        html: `<p>Click <a href="${url}">here</a> to reset your password!</p><p>This link will only be valid for the next 2 hours.</p><p>This email was sent automatically, do not anwser it.</p>`
    });
}

async function sendContactMessage(from, object, message) {
    if (!from || !from.length || !object || !object.length || !message || !message.length) {
        throw new ValueError(400, "Invalid information");
    }

    if (!emailAdmin || !emailAdmin.length) {
        if (process.env.NODE_ENV !== "production") {
            throw new ValueError(500, "Email Admin not provided!");
        } else {
            throw new InternalError("Oups! Something went wrong!");
        }
    }

    const parsedMessage = `From: ${from}\n\n` +
        message;

    return transporter.sendMail({
        from: `"GameSorting" <${emailSender}>`,
        to: emailAdmin,
        subject: object,
        text: parsedMessage,
        html: `<p>${parsedMessage.replaceAll("\n", "<br>")}</p>`
    });
}

module.exports = {
    transporter,
    emailSender,
    sendLostPasswordEmail,
    sendContactMessage
};
