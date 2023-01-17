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

function name(joiObject) {
    if (!joiObject) {
        joiObject = Joi.object().keys({});
    }

    return joiObject.keys({
        name: nameValidation
    });
}

function itemValidation(itemToValidate) {
    let joiObject = Joi.object().keys({});

    for (let key in itemToValidate) {
        if (key === "name") {
            joiObject = name(joiObject);
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