const { celebrate, Joi, Segments } = require("celebrate");
/*
Validation of ID
*/
const IDValidation = Joi.number().greater(0).required();

function collection() {
    return Joi.object().keys({
        collectionID: IDValidation
    });
}

function list() {
    return collection().keys({
        listID: IDValidation
    });
}

function item() {
    return list().keys({
        itemID: IDValidation
    });
}

function idValidation(id) {
    if (id.item) {
        return item();
    } else if (id.list) {
        return list();
    } else if (id.collection) {
        return collection();
    } else {
        Joi.object().keys({});
    }
}

/*
String Validation
*/
const nameValidation = Joi.string().trim().max(300, "utf8").required();
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
const customColumnsValidation = Joi.array().items(Joi.object({
    CustomRowItemsID: Joi.any().empty(),
    ListColumnTypeID: Joi.any().empty(),
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

function validateID(whatToValidate) {
    if (!whatToValidate) {
        throw new Error("Invalid Validation Request");
    }

    return celebrate(paramsValidation(idValidation(whatToValidate)));
}

function validateItem(itemToValidate) {
    if (!itemToValidate) {
        throw new Error("Invalid Validation Request");
    }

    return celebrate(bodyValidation(itemValidation(itemToValidate)));
}

module.exports = {
    id: {
        collection: validateID({ collection: true }),
        list: validateID({ list: true }),
        item: validateID({ item: true })
    },
    item: function(itemToValidate) {
        return validateItem(itemToValidate);
    }
}