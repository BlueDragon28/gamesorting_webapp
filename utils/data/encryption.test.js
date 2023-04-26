require("../testingEnv");
const { encrypt, decrypt } = require("./encryption").AES_unique;

const baseText = "I am an encryption test!";
let encryptedData = null;

test("test encrypt a string", function() {
    encryptedData = encrypt(baseText);

    expect(typeof encryptedData).toBe("string");
});

test("test decrypt a string", function() {
    const decryptString = decrypt(encryptedData);

    expect(typeof decryptString).toBe("string");
    expect(decryptString.length).toBe(baseText.length);
    expect(decryptString).toBe(decryptString);
});