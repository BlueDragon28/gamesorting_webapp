const sanitizeHTML = require("sanitize-html");

function revertEscapedEntities(str) {
    return str.replaceAll(/&amp;/g, "&")
        .replaceAll(/&lt;/g, "<")
        .replaceAll(/&gt;/g, ">");
}

function sanitizeText(str) {
    if (typeof str !== "string") return "";

    return revertEscapedEntities(
        sanitizeHTML(str, {
            allowedTags: [],
            allowedAttributes: []
        })
    );
}

module.exports = {
    sanitizeText,
};
