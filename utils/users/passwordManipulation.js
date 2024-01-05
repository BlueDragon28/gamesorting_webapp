const characterSeeds = "0123456789abcdefABCDEF";
const RANDOM_PASSWORD_LENGTH = 14;

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function generatePassword(length) {
    let password = "";
    for (let i = 0; i < length; i++) {
        password += characterSeeds[getRandomInt(characterSeeds.length)];
    }
    return password;
}

module.exports = {
    generatePassword,
    RANDOM_PASSWORD_LENGTH,
};
