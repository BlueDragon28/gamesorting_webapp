const { isCelebrateError } = require("celebrate");
const { InternalError } = require("./exceptions");

function parseCelebrateError(err, req, res, next) {
    if (!isCelebrateError(err)) {
        return next(err);
    }

    const [ firstError ] = err.details.values();

    if (!firstError) {
        return next(new InternalError("Invalid Error"));
    }

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

function checkIfJSON(acceptHeader) {
    if (!acceptHeader || typeof acceptHeader !== "string" || !acceptHeader.length) {
        return false;
    }

    const firstAccept = acceptHeader.split(";")[0].trim();

    if (!firstAccept || firstAccept !== "application/json") {
        return false;
    }

    return true;
}

function returnHasJSONIfNeeded(err, req, res, next) {
    if (!checkIfJSON(req.headers.accept)) {
        return next(err);
    }

    const { statusCode = 500, message = "OUPS!!! Something Went Wrong!" } = err;

    res.set("Content-Type", "application/json")
        .status(statusCode)
        .send({
            type: "ERROR",
            message: message
        });
}

function errorsWithPossibleRedirect(customErrorMessage, redirectLocation = null) {
    return function(error, req, res, next) {
        if (error.name === "ValueError" || error.name === "ValidationError") {
            if (req.method === "GET" && req.url.length > 1) {
                req.flash("error", customErrorMessage);
                if (typeof redirectLocation === "string" && redirectLocation.length) {
                    return res.redirect(redirectLocation);
                } else {
                    return res.redirect(req.baseUrl);
                }
            } else if (req.method === "POST" || req.method === "PUT") {
                flashJoiErrorMessage(error, req);
                //return res.redirect(`${req.originalUrl}`);
                return res.redirect("/collections");
            }
        } else if (error.name === "InternalError" || error.name === "SqlError") {
            req.flash("error", "Oups!!! Something went wrong!");
            return res.redirect(process.env.NODE_ENV ==="production" ? "/collections" : "/");
        } else if (error.name === "AuthorizationError" || error.name === "LimitError") {
            req.flash("error", error.message);
            return res.redirect(process.env.NODE_ENV ==="production" ? "/collections" : "/");
        }

        next(error);
    }
}

module.exports = {
    parseCelebrateError,
    errorsWithPossibleRedirect,
    returnHasJSONIfNeeded,
    flashJoiErrorMessage
}
