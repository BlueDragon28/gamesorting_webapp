const wrapAsync = require("./wrapAsync");

test("Test wrapAsync, should catch exception", function() {
    function setError(error) {
        expect(error).toBeInstanceOf(Error);
    }

    async function throwError(req, res, next) {
        throw new Error("error");
    }

    test = wrapAsync(throwError)(null, null, setError)
});
