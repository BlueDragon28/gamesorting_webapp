const { isCelebrateError } = require("celebrate");
const { InternalError } = require("./exceptions");

function parseCelebrateError(err, req, res, next) {
    if (!isCelebrateError(err)) {
        return next(err);
    }

    const [ firstError ] = err.details.values();

    if (!firstError) {
        next(new InternalError("Invalid Error"));
    }

    console.log(firstError);

    next(firstError);
}

function flashJoiErrorMessage(error, req) {
    if (error.name === "ValueError") {
        req.flash("error", "Invalid Value");
    } else if (error.name === "ValidationError") {
        for (let errorMessage of error.details) {
            req.flash("error", errorMessage.message);
        }
    }
}

function errorsWithPossibleRedirect(customErrorMessage) {
    return function(error, req, res, next) {
        if (error.name === "ValueError" || error.name === "ValidationError") {
            if (req.method === "GET" && req.url.length > 1) {
                req.flash("error", customErrorMessage);
                return res.redirect(req.baseUrl);
            } else if (req.method === "POST" || req.method === "PUT") {
                flashJoiErrorMessage(error, req);
                return res.redirect(`${req.originalUrl}/edit`);
            }
        } else if (error.name === "InternalError" || error.name === "SqlError") {
            req.flash("error", "Oups!!! Something went wrong!");
            console.log(error);
            return res.redirect("/collections");
        } else if (error.name === "AuthorizationError") {
            req.flash("error", error.message);
            return res.redirect("/collections");
        }

        next(error);
    }
}

module.exports = {
    parseCelebrateError,
    errorsWithPossibleRedirect
}
