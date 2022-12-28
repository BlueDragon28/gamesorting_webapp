/*
Handle bigint manipulation
*/

/*
Convert string to BigInt
*/
const fromStringToBigInt = (str) => {
    if (!str && typeof str !== "string") {
        return null;
    }

    const bigIntValue = BigInt(str);

    if (!bigIntValue) {
        return null;
    }

    return bigIntValue;
};

/*
Check if a value is a valid number
*/
const isValid = (bigint) => {
    if (!bigint && 
            typeof bigint !== "number" &&
            typeof bigint !== "bigint" &&
            typeof bigint !== "string") {
        return false;
    }

    if (typeof bigint === "string") {
        bigint = fromStringToBigInt(bigint);
    }

    return bigint ? true : false;
}

/*
Convert a value to a bigint
*/
const toBigInt = (value) => {
    if (!isValid(value)) {
        return null;
    }

    if (typeof value === "string") {
        return fromStringToBigInt(value);
    }

    if (typeof value === "number") {
        return BigInt(value);
    }

    return value;
}

module.exports = {
    isValid,
    toBigInt
};