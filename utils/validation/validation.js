const { celebrate, Segments } = require("celebrate");
const Joi = require("./extendedJoi");

/*
Validation of ID
*/
const IDValidation = Joi.alternatives().try(
    Joi.string().min(1, "utf8").pattern(/^[0-9]+$/),
    Joi.string().pattern(/^new$/)
);

function idValidation() {
    return Joi.object().keys({
        collectionID: IDValidation,
        listID: IDValidation,
        itemID: IDValidation
    }).unknown();
}

/*
String Validation
*/
const nameValidation = Joi.string().trim().max(300, "utf8").forbidHTML().required();
const uriValidation = Joi.alternatives().try(
    Joi.string().trim().max(10000, "utf8").uri({
        scheme: [
            "http",
            "https"
        ],
        allowQuerySquareBrackets: true,
    }),
    Joi.string().trim().max(0).min(0)
);

const customDataIDValidation = Joi.string().min(1, "utf8").regex(/^-?[0-9]+$/); // Validation of custom data ID
const customColumnsValidation = Joi.array().items(Joi.object({
    CustomRowItemsID: customDataIDValidation,
    ListColumnTypeID: customDataIDValidation,
    Value: nameValidation.min(0)
}).unknown().or("CustomRowItemsID", "ListColumnTypeID"));

function name(joiObject) {
    if (!joiObject) {
        joiObject = Joi.object().keys({});
    }

    return joiObject.keys({
        name: nameValidation
    });
}

function url(joiObject) {
    if (!joiObject) {
        joiObject = Joi.object().keys({});
    }

    return joiObject.keys({
        url: uriValidation
    });
}

function customData(joiObject) {
    if (!joiObject) {
        joiObject = Joi.object().keys({});
    }

    return joiObject.keys({
        customColumns: customColumnsValidation
    });
}

function itemValidation(itemToValidate) {
    let joiObject = Joi.object().keys({});

    for (let key in itemToValidate) {
        if (key === "name") {
            joiObject = name(joiObject);
        } else if (key === "url") {
            joiObject = url(joiObject);
        } else if (key === "customData") {
            joiObject = customData(joiObject);
        }
    }

    return joiObject;
}

/*
Celebrate calling interface
*/
function paramsValidation(joiObject) {
    return {
        [Segments.PARAMS]: joiObject
    };
}

function bodyValidation(joiObject) {
    return {
        [Segments.BODY]: joiObject.unknown()
    };
}

function validateID() {
    return celebrate(paramsValidation(idValidation()));
}

function validateItem(itemToValidate) {
    if (!itemToValidate) {
        throw new Error("Invalid Validation Request");
    }

    return celebrate(bodyValidation(itemValidation(itemToValidate)));
}

function validateMoveItemTo() {
    const celebrateValidation = {
        [Segments.BODY]: Joi.object({
            moveToListID: Joi.number().min(1).required()
        }).required()
    };

    return celebrate(celebrateValidation);
}

module.exports = {
    id: validateID(),
    item: function(itemToValidate) {
        return validateItem(itemToValidate);
    },
    validateMoveItemTo,
    _: {
        validateID: function() {
            return paramsValidation(idValidation());
        },
        validateItem: function(itemToValidate) {
            return bodyValidation(itemValidation(itemToValidate));
        }
    }
}
