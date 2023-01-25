function parseMessages(flashMessages, messageType) {
    if (!flashMessages || !Array.isArray(flashMessages) || !messageType || typeof messageType !== "string") {
        return [];
    }

    const messages = [];

    for (let message of flashMessages) {
        messages.push({
            type: messageType,
            message: message
        });
    }

    return messages.length > 0 ? messages : [];
}

function parseFlashMessage(req, res, next) {
    if (!req.flash) {
        next();
    }

    const successMessages = parseMessages(req.flash("success"), "success");
    const errorMessages = parseMessages(req.flash("error"), "error");
    
    res.locals.flashMessages = successMessages.concat(errorMessages);

    next();
}

module.exports = {
    parseFlashMessage
}
