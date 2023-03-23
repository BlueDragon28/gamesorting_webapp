const { InternalError } = require("../errors/exceptions");
const AES = require("crypto-js/aes");

const key = process.env.ENCRYPT_KEY;

if (!key || typeof key !== "string" || !key.trim().length()) {
    throw new InternalError("No encryption key provided!");
}

function encryptToAES(text) {
    return AES.encrypt(text, key);
}

function decryptFromAES(data) {
    return AES.decrypt(text, key)
}

module.exports = {
    AES: {
        encrypt: encryptToAES,
        decrypt: decryptFromAES
    }
};
