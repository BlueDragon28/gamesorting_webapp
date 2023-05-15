const { Joi } = require("celebrate");
const sanitizeHTML = require("sanitize-html");

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

const customJoi = Joi.extend(htmlSanitizeExtension);

module.exports = customJoi;
