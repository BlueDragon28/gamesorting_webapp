require("../utils/testingEnv");
const mariadb = require("../sql/connection");
const seeds = require("../sql/seeds");
const { List } = require("./lists");
const { Item } = require("./items");
const { ListColumnType } = require("./listColumnsType");
const { CustomRowsItems } = require("./customUserData");

let listColumnType;
let item;

beforeAll(async function() {
    mariadb.openPool();
    await seeds.seeds();
    listColumnType = await ListColumnType.findByID(1);
    item = await Item.findByID(1);
});

afterAll(async function() {
    return mariadb.closePool();
});

test("Create valid custom data object", async function() {
    let customRowsItems = new CustomRowsItems("ave maria", item.id, listColumnType.id);
    customRowsItems.id = 1;
    expect(customRowsItems.isValid()).toBe(true);

    customRowsItems = new CustomRowsItems("a new CustomRowsItems", item.id, listColumnType.id);
    customRowsItems.id = 27;
    expect(customRowsItems.isValid()).toBe(true);

    customRowsItems = new CustomRowsItems("another CustomRowsItems", item.id, listColumnType.id);
    expect(customRowsItems.isValid()).toBe(true);

    customRowsItems = new CustomRowsItems("A CustomRowsItems", item.id, listColumnType.id);
    expect(customRowsItems.isValid()).toBe(true);
});

test("Create custom data object with invalid parent item", async function() {
    let customRowsItem = new CustomRowsItems("A CustomRowsItem", null, listColumnType.id);
    expect(customRowsItem.isValid()).toBe(false);

    customRowsItem = new CustomRowsItems("A CustomRowsItem", new Item(), listColumnType.id);
    expect(() => customRowsItem.isValid()).toThrow();

    customRowsItem = new CustomRowsItems("A List", NaN, listColumnType.id);
    expect(customRowsItem.isValid()).toBe(false);
});

test("Create custom data object with invalid parent List Column Type", async function() {
    let customRowsItem = new CustomRowsItems("A CustomRowsItem", item.id, null);
    expect(customRowsItem.isValid()).toBe(false);

    customRowsItem = new CustomRowsItems("A CustomRowsItem", item.id, new ListColumnType());
    expect(() => customRowsItem.isValid()).toThrow();

    customRowsItem = new CustomRowsItems("A List", item.id, NaN);
    expect(customRowsItem.isValid()).toBe(false);
});

test("Create custom data object with invalid name", async function() {
    let customRowsItems = new CustomRowsItems(null, item.id, listColumnType.id);
    expect(customRowsItems.isValid()).toBe(false);

    customRowsItems = new CustomRowsItems("      ", item.id, listColumnType.id);
    expect(customRowsItems.isValid()).toBe(false);

    customRowsItems = new CustomRowsItems("", item.id, listColumnType.id);
    expect(customRowsItems.isValid()).toBe(false);

    customRowsItems = new CustomRowsItems(25, item.id, listColumnType.id);
    expect(customRowsItems.isValid()).toBe(false);
});

test("Create custom data object with invalid id", async function() {
    let customRowsItems = new CustomRowsItems("customRowsItems", item.id, listColumnType.id);
    customRowsItems.id = "Hello There";
    expect(() => customRowsItems.isValid()).toThrow();

    customRowsItems.id = { id: 1 };
    expect(() => customRowsItems.isValid()).toThrow();

    customRowsItems.id = true;
    expect(() => customRowsItems.isValid()).toThrow();

    customRowsItems.id = false;
    expect(() => customRowsItems.isValid()).toThrow();
});

describe("custom data dabase manipulation", function() {
    async function customDataQuery(func) {
        let error;
        let queryResult

        try {
            queryResult = await func();
        } catch (err) {
            error = err;
        }

        return [queryResult, error];
    }

    let customData;

    it ("save a customData", async function() {
        customData = new CustomRowsItems("A New CustomRowsItems", item.id, listColumnType.id);
        const [,error] = await customDataQuery(async () => customData.save());

        expect(customData?.isValid()).toBe(true);
        expect(error).toBe(undefined);
        expect(typeof customData?.id).toBe("bigint");
    });

    it("save an invalid customData", async function() {
        let [,error] = await customDataQuery(async () => new CustomRowsItems("a CustomRowsItems", null, listColumnType.id).save());

        expect(error).not.toBe(undefined);

        [,error] = await customDataQuery(async () => new CustomRowsItems("", item.id, listColumnType.id).save());
       
        expect(error).not.toBe(undefined);
    });

    it("get a customData from id", async function() {
        let [findCustomRowsItems, error] = await customDataQuery(async () => CustomRowsItems.findByID(customData.id));

        expect(findCustomRowsItems instanceof CustomRowsItems).toBe(true);
        expect(error).toBe(undefined);
        expect(findCustomRowsItems?.id).toBe(customData.id);
        expect(typeof findCustomRowsItems?.id).toBe("bigint");
        expect(findCustomRowsItems?.value).toBe("A New CustomRowsItems");

        [findCustomRowsItems, error] = await customDataQuery(async () => List.findByID(0));

        expect(error).toBe(undefined);
        expect(findCustomRowsItems).toBe(null);
    });

    it("update a customData", async function() {
        customData.value = "Another customData";
        const [,error] = await customDataQuery(async () => customData.save());
        expect(error).toBe(undefined);
    });

    it("check updated customData", async function() {
        const [findCustomData, error] =
            await customDataQuery(async () => CustomRowsItems.findByID(customData.id));

        expect(error).toBe(undefined);
        expect(findCustomData instanceof CustomRowsItems).toBe(true);
        expect(typeof findCustomData?.id).toBe("bigint");
        expect(findCustomData?.id).toBe(customData.id);
        expect(findCustomData.value).toBe("Another customData");
        expect(findCustomData.itemID).toBe(item.id);
        expect(findCustomData.columnTypeID).toBe(listColumnType.id);
    });

    it("check update invalid customData", async function() {
        const updatedCustomData = new CustomRowsItems(null, item.id, listColumnType.id);
        updatedCustomData.id = customData.id;
        
        let [,error] = await customDataQuery(async () => updatedCustomData.save());

        expect(error).not.toBe(undefined);

        updatedCustomData.id = 2;
        updatedCustomData.value = "";

        [,error] = await customDataQuery(async () => updatedCustomData.save());

        expect(error).not.toBe(undefined);

        updatedCustomData.value = 25;

        [,error] = await customDataQuery(async () => updatedCustomData.save());

        expect(error).not.toBe(undefined);
    });

    it("find customData from item", async function() {
        let [foundCustomData, error] = 
            await customDataQuery(async () => CustomRowsItems.findFromItem(item.id));

        expect(error).toBe(undefined);
        expect(Array.isArray(foundCustomData)).toBe(true);
        expect(foundCustomData.length).toBe(2);
        expect(foundCustomData[1].id).toBe(customData.id);

        [foundCustomData,error] =
            await customDataQuery(async () => CustomRowsItems.findFromItem(0));
        expect(error).toBe(undefined);
        expect(Array.isArray(foundCustomData)).toBe(true);
        expect(foundCustomData.length).toBe(0);
    });

    it("find from ListColumnType", async function() {
        let [foundCustomData, error] =
            await customDataQuery(async () => CustomRowsItems.findFromListColumn(listColumnType.id));

        expect(error).toBe(undefined);
        expect(Array.isArray(foundCustomData)).toBe(true);
        expect(foundCustomData.length).toBe(3);
        expect(foundCustomData[2].id).toBe(customData.id);
    });

    it("delete a list", async function() {
        const [,error] = await customDataQuery(async () => customData.delete());
        expect(error).toBe(undefined);
    });

    it("delete invalid list", async function() {
        const [,error] = await customDataQuery(async () => CustomRowsItems.deleteFromID(600000000000000));
        expect(error).not.toBe(undefined);
    });
});

