const { InternalError } = require("../errors/exceptions");
const AES = require("aes-js");

if (!process.env.ENCRYPT_KEY || typeof process.env.ENCRYPT_KEY !== "string" || !process.env.ENCRYPT_KEY.length) {
    throw new InternalError("You must provide a valid key");
}

if (!process.env.ENCRYPT_IV || typeof process.env.ENCRYPT_IV !== "string" || !process.env.ENCRYPT_IV.length) {
    throw new InternalError("Invalid initialization vector");
}

const key = process.env.ENCRYPT_KEY.split(",")
    .map(value => parseInt(value.trim()));

const iv = process.env.ENCRYPT_IV.split(",")
    .map(value => parseInt(value.trim()));

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


function arrayToMultipleOf16(array) {
    const newArray = [...array];
    while (newArray.length % 16 !== 0) {
        newArray.push(32);
    }

    return newArray;
}

function encryptToAES(text, encryptionKey, initialVectorKey) {
    if (!encryptionKey) encryptionKey = key;
    if (!initialVectorKey) initialVectorKey = iv;

    const aesCbc = new AES.ModeOfOperation.cbc(encryptionKey, initialVectorKey);
    const textBytes = arrayToMultipleOf16(AES.utils.utf8.toBytes(text));
    const encryptedBytes = aesCbc.encrypt(textBytes);
    const encryptedHex = AES.utils.hex.fromBytes(encryptedBytes);
    return encryptedHex;
}

function decryptFromAES(data, encryptionKey, initialVectorKey) {
    if (!encryptionKey) encryptionKey = key;
    if (!initialVectorKey) initialVectorKey = iv;

    const aesCbc = new AES.ModeOfOperation.cbc(encryptionKey, initialVectorKey);
    const encryptedBytes = AES.utils.hex.toBytes(data);
    const decryptedBytes = aesCbc.decrypt(encryptedBytes);
    const decryptedText = AES.utils.utf8.fromBytes(decryptedBytes);
    return decryptedText.trim();
}

module.exports = {
    AES_unique: {
        encrypt: encryptToAES,
        decrypt: decryptFromAES
    }
};
