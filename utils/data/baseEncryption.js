const AES = require("aes-js");

function arrayToMultipleOf16(array) {
    const newArray = [...array];
    while (newArray.length % 16 !== 0) {
        newArray.push(0x0f);
    }

    return newArray;
}

function checkIfKeyAreValid(encryptionKey, initialVectorKey) {
    if (encryptionKey.length !== 16 && encryptionKey.length !== 24 && encryptionKey.length !== 32) {
        return false;
    }

    for (const keyByte of encryptionKey) {
        if (keyByte < 0 || keyByte > 255) {
            return false;
        }
    }

    if (initialVectorKey.length !== 16) {
        return false;
    }

    for (const ivByte of initialVectorKey) {
        if (ivByte < 0 || ivByte > 255) {
            return false;
        }
    }

    return true;
}

function encryptToAES(text, encryptionKey, initialVectorKey) {
    if (!encryptionKey) return null;
    if (!initialVectorKey) return null;

    if (!checkIfKeyAreValid(encryptionKey, initialVectorKey)) return null;

    const aesCbc = new AES.ModeOfOperation.cbc(encryptionKey, initialVectorKey);
    const textBytes = arrayToMultipleOf16(AES.utils.utf8.toBytes(text));
    const encryptedBytes = aesCbc.encrypt(textBytes);
    const encryptedHex = AES.utils.hex.fromBytes(encryptedBytes);
    return encryptedHex;
}

function decryptFromAES(data, encryptionKey, initialVectorKey) {
    if (!encryptionKey) encryptionKey = key;
    if (!initialVectorKey) initialVectorKey = iv;

    if (!checkIfKeyAreValid(encryptionKey, initialVectorKey)) return null;

    const aesCbc = new AES.ModeOfOperation.cbc(encryptionKey, initialVectorKey);
    const encryptedBytes = AES.utils.hex.toBytes(data);
    const decryptedBytes = aesCbc.decrypt(encryptedBytes);
    const decryptedBuffer = Buffer.from(decryptedBytes);
    const lastValueIndex = decryptedBuffer.indexOf(0x0f);
    const decryptedText = decryptedBuffer.subarray(0, lastValueIndex).toString("utf8");
    return decryptedText.trim();
}

module.exports = {
    encrypt: encryptToAES,
    decrypt: decryptFromAES
}