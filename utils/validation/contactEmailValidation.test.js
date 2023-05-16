const { contactMessage } = require("./contactEmailValidation")._;

const contactValidation = contactMessage();

it("test valid message", function() {
    let result = contactValidation.validate({
        from: "from@email.com",
        object: "Contact information",
        message: "Hello There, I'm trying to contact you!"
    });
    expect(result.error).toBe(undefined);
});

it("test with invalid message", function() {
    let result = contactValidation.validate({
        from: "blabla",
        object: "Contact information",
        message: "Hello There, I'm trying to contact you!"
    });
    expect(result.error).not.toBe(undefined);

    result = contactValidation.validate({
        from: "from@email.com",
        object: "",
        message: "Hello There, I'm trying to contact you!"
    });
    expect(result.error).not.toBe(undefined);

    result = contactValidation.validate({

        from: "from@email.com",
        object: "Contact information",
        message: ""
    });
    expect(result.error).not.toBe(undefined);

    result = contactValidation.validate({
        from: "from@email.com",
    });
    expect(result.error).not.toBe(undefined);
})