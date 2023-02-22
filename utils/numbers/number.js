function isNumber(number) {
    return typeof number === "number" && !isNaN(number - number);
}

module.exports = {
    isNumber
};
