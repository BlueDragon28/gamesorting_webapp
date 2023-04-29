const { InternalError } = require("../errors/exceptions");
const { encrypt, decrypt } = require("./baseEncryption");
const { isFileBased, getEnvValueFromFile, hexTo8bitNumber } = require("../loadingEnvVariable");

if (!process.env.ENCRYPT_KEY || typeof process.env.ENCRYPT_KEY !== "string" || !process.env.ENCRYPT_KEY.length) {
    throw new InternalError("You must provide a valid key");
}

if (!process.env.ENCRYPT_IV || typeof process.env.ENCRYPT_IV !== "string" || !process.env.ENCRYPT_IV.length) {
    throw new InternalError("Invalid initialization vector");
}

let key;
let iv;
if (process.env.NODE_ENV !== "production") {
    key = process.env.ENCRYPT_KEY.split(",")
        .map(value => parseInt(value.trim()));

    iv = process.env.ENCRYPT_IV.split(",")
        .map(value => parseInt(value.trim()));
} else {
    key = isFileBased(process.env.ENCRYPT_KEY) ?
        hexTo8bitNumber(getEnvValueFromFile(process.env.ENCRYPT_KEY)) :
        process.env.ENCRYPT_KEY;

    iv = isFileBased(process.env.ENCRYPT_IV) ?
        hexTo8bitNumber(getEnvValueFromFile(process.env.ENCRYPT_IV)) :
        process.env.ENCRYPT_IV;
}

if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
    throw new InternalError("Invalid key size");
}

for (const keyByte of key) {
    if (keyByte < 0 || keyByte > 255) {
        throw new InternalError("Key bytes must be in the range [0-255]");
    }
}

if (iv.length !== 16) {
    throw new InternalError("Initialization vector must be 16 bytes");
}

for (const ivByte of iv) {
    if (ivByte < 0 || ivByte > 255) {
        throw new InternalError("Initialization bytes must be in the range [0-255]");
    }
}

function encryptToAES(text, encryptionKey, initialVectorKey) {
    const encKey = encryptionKey ? encryptionKey : key;
    const encIv = initialVectorKey ? initialVectorKey : iv;
    return encrypt(text, encKey, encIv);
}

function decryptFromAES(data, encryptionKey, initialVectorKey) {
    const encKey = encryptionKey ? encryptionKey : key;
    const encIv = initialVectorKey ? initialVectorKey : iv;
    return decrypt(data, encKey, encIv);
}

module.exports = {
    AES_unique: {
        encrypt: encryptToAES,
        decrypt: decryptFromAES
    }
};
