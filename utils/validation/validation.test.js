const { _: validation } = require("./validation");

describe("test params validation", function() {
    it("test valid id params", function() {
        const joiObject = validation.validateID().params;

        for (let item of ["collectionID", "listID", "itemID"]) {
            let result = joiObject.validate({ [item]: "1" });
            expect(result.error).toBe(undefined);
            expect(result.value[item]).toBe("1");

            result = joiObject.validate({ [item]: "75" });
            expect(result.error).toBe(undefined);
            expect(result.value[item]).toBe("75");

            result = joiObject.validate({ [item]: "new" });
            expect(result.error).toBe(undefined);
            expect(result.value[item]).toBe("new");
        }

        let result = joiObject.validate({ collectionID: "1", listID: "75", itemID: "new" });
        expect(result.error).toBe(undefined);
        expect(result.value.collectionID).toBe("1");
        expect(result.value.listID).toBe("75");
        expect(result.value.itemID).toBe("new");
   });

    it("test invalid id params", function() {
        const joiObject = validation.validateID().params;

        for (let item of ["collectionID", "listID", "itemID"]) {
            let result = joiObject.validate({ [item]: null });
            expect(result.error).not.toBe(undefined);

            result = joiObject.validate({ [item]: "-5" });
            expect(result.error).not.toBe(undefined);
        }
    });
});

describe("test item data validation", function() {
    it("test valid name validation", function() {
        const joiObject = validation.validateItem({ name: true }).body;
        let result = joiObject.validate({ name: "New Item" });

        expect(result.error).toBe(undefined);

        result = joiObject.validate({ name: "     Whow    " });

        expect(result.error).toBe(undefined);
    });

    it("test invalid name", function() {
        const joiObject = validation.validateItem({ name: true }).body;
        let result = joiObject.validate({ name: null });
        expect(result.error).not.toBe(undefined);

        result = joiObject.validate({ name: "" });
        expect(result.error).not.toBe(undefined);

        result = joiObject.validate({  });
        expect(result.error).not.toBe(undefined);
    });

    it("test valid url validation", function() {
        const joiObject = validation.validateItem({ url: true }).body;

        let result = joiObject.validate({ url: "http://www.somesite.com" });
        expect(result.error).toBe(undefined);

        result = joiObject.validate({ url: "https://somesite.com" });
        expect(result.error).toBe(undefined);
    });

    it("test invalid url", function() {
        const joiObject = validation.validateItem({ url: true }).body;

        let result = joiObject.validate({ url: "http" });
        expect(result.error).not.toBe(undefined);

        result = joiObject.validate({ url: "hello there" });
        expect(result.error).not.toBe(undefined);

        result = joiObject.validate({ url: null });
        expect(result.error).not.toBe(undefined);
    });

    it("test valid customData validation", function() {
        const joiObject = validation.validateItem({ customData: true }).body;
        
        let result = joiObject.validate({ 
            customColumns: [
                {
                    CustomRowItemsID: "-1",
                    Value: "some item"
                }
            ]
        });
        expect(result.error).toBe(undefined);

        result = joiObject.validate({
            customColumns: [
                {
                    ListColumnTypeID: "15",
                    Value: "some item"
                }
            ]
        });
        expect(result.error).toBe(undefined);

        result = joiObject.validate({
            customColumns: [
                {
                    ListColumnTypeID: "15",
                    Value: "some item"
                },
                {
                    CustomRowItemsID: "-1",
                    Value: "some new item"
                }
            ]
        });
        expect(result.error).toBe(undefined);

        result = joiObject.validate({
            customColumns: [

            ]
        });
        expect(result.error).toBe(undefined);
    });

    it("test invalid customData", function() {
        const joiObject = validation.validateItem({ customData: true }).body;

        let result = joiObject.validate({
            customColumns: [
                {

                }
            ]
        });
        expect(result.error).not.toBe(undefined);

        result = joiObject.validate({
            customColumns: [
                {
                    ListColumnTypeID: "15"
                }
            ]
        });
        expect(result.error).not.toBe(undefined);

        result = joiObject.validate({
            customColumns: {
                ListColumnTypeID: null,
                Value: "Some Test"
            }
        });
        expect(result.error).not.toBe(undefined);

        result = joiObject.validate({
            customColumns: {
                ListColumnTypeID: "15",
                Value: null
            }
        });
        expect(result.error).not.toBe(undefined);

        result = joiObject.validate({
            customColumns: {
                ListColumnTypeID: "15",
                CustomRowItemsID: "-1",
                Value: "Some Test"
            }
        });
        expect(result.error).not.toBe(undefined);
    });
});
