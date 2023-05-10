const nodemailer = require("nodemailer");

const senderEmail = process.env.EMAIL_SENDER;

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true" ? true : false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendLostPasswordEmail(to, url) {
    return transporter.sendMail({
        from: `"GameSorting" <${senderEmail}>`,
        to,
        subject: "Lost password",
        text: "Click here to reset your password!\nThis link will only be valid for the next 2 hours.\nThis email was sent automatically, do not anwser it.",
        html: `<p>Click <a href="${url}">here</a> to reset your password!</p><p>This link will only be valid for the next 2 hours.</p><p>This email was sent automatically, do not anwser it.</p>`
    });
}

module.exports = {
    transporter,
    senderEmail,
    sendLostPasswordEmail
};
