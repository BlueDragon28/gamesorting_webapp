const { Joi } = require("celebrate");
const sanitizeHTML = require("sanitize-html");
const { sanitizeText } = require("./sanitizeText");

function revertEscapedEntities(str) {
    return str.replaceAll(/&amp;/g, "&")
        .replaceAll(/&lt;/g, "<")
        .replaceAll(/&gt;/g, ">");
}

function htmlSanitizeExtension(joi) {
    return {
        type: "string",
        base: Joi.string(),
        messages: {
            "string.forbidHTML": "{{#label}} is not allowed to contain HTML"
        },
        rules: {
            forbidHTML: {
                validate(value, helpers) {
                    const sanitized = revertEscapedEntities(sanitizeHTML(value, {
                        allowedTags: [],
                        allowedAttributes: {}
                    }));
                    if (sanitized !== value) {
                        return helpers.error("string.forbidHTML", {value})
                    }

                    return sanitized;
                }
            }
        }
    };
}

function sanitize(Joi) {
    return {
        type: "string",
        base: Joi.string(),
        rules: {
            sanitize: {
                validate(value, helpers) {
                    return sanitizeText(value);
                }
            }
        }
    };
}

const customJoi = Joi.extend(htmlSanitizeExtension).extend(sanitize);

module.exports = customJoi;
