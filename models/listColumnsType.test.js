require("../utils/testingEnv");
const mariadb = require("../sql/connection");
const seeds = require("../sql/seeds");
const { List } = require("./lists");
const { Item } = require("./items");
const { ListColumnType } = require("./listColumnsType");
const { CustomRowsItems } = require("./customUserData");

let list;

const stringType = {
    type: "@String"
};

const intType = {
    type: "@Int",
    min: -1000,
    max: 1000
};

beforeAll(async function() {
    mariadb.openPool("_testing");
    await seeds.seeds();
    list = await List.findByID(1)
});

afterAll(async function() {
    return mariadb.closePool();
});

test("Create valid List Column Type object", async function() {
    let listColumnType = new ListColumnType("ave maria", stringType, list);
    listColumnType.id = 1;
    expect(listColumnType.isValid()).toBe(true);

    listColumnType = new ListColumnType("a new listColumnType", intType, list);
    listColumnType.id = 27;
    expect(listColumnType.isValid()).toBe(true);

    listColumnType = new ListColumnType("another listColumnType", stringType, list);
    expect(listColumnType.isValid()).toBe(true);

    listColumnType = new ListColumnType("A listColumnType", intType, list);
    expect(listColumnType.isValid()).toBe(true);
});

test("Create List Column Type object with invalid parent list", async function() {
    let listColumnType = new ListColumnType("A ListColumnType", stringType, null);
    expect(listColumnType.isValid()).toBe(false);

    listColumnType = new ListColumnType("A ListColumnType", intType, new List());
    expect(listColumnType.isValid()).toBe(false);

    listColumnType = new ListColumnType("A ListColumnType", stringType, NaN);
    expect(listColumnType.isValid()).toBe(false);
});

test("Create List Column Type object with invalid name", async function() {
    let listColumnType = new ListColumnType(null, stringType, list);
    expect(listColumnType.isValid()).toBe(false);

    listColumnType = new ListColumnType("      ", stringType, list);
    expect(listColumnType.isValid()).toBe(false);

    listColumnType = new ListColumnType("", stringType, list);
    expect(listColumnType.isValid()).toBe(false);

    listColumnType = new ListColumnType(25, stringType, list);
    expect(listColumnType.isValid()).toBe(false);
});

test("Create List Column Type object with invalid type", async function() {
    let listColumnType = new ListColumnType("Hello There", null, list);
    expect(listColumnType.isValid()).toBe(false);

    listColumnType = new ListColumnType("Hello There", {}, list);
    expect(listColumnType.isValid()).toBe(false);

    listColumnType = new ListColumnType("Hello There", "@String", list);
    expect(listColumnType.isValid()).toBe(false);

    listColumnType = new ListColumnType("Hello There", NaN, list);
    expect(listColumnType.isValid()).toBe(false);

    listColumnType = new ListColumnType("Hello There", 56, list);
    expect(listColumnType.isValid()).toBe(false);
});

test("Create List Column Type object with invalid id", async function() {
    let listColumnType = new ListColumnType("ListColumnType", list);
    listColumnType.id = "Hello There";
    expect(() => listColumnType.isValid()).toThrow();

    listColumnType.id = { id: 1 };
    expect(() => listColumnType.isValid()).toThrow();

    listColumnType.id = true;
    expect(() => listColumnType.isValid()).toThrow();

    listColumnType.id = false;
    expect(() => listColumnType.isValid()).toThrow();
});

describe("collection dabase manipulation", function() {
    async function listColumnTypeQuery(func) {
        let error;
        let queryResult

        try {
            queryResult = await func();
        } catch (err) {
            error = err;
        }

        return [queryResult, error];
    }

    let listColumnType;

    it ("save a List Column Type", async function() {
        listColumnType = new ListColumnType("A New ListColumnType", stringType, list);
        const [,error] = await listColumnTypeQuery(async () => listColumnType.save());

        expect(listColumnType?.isValid()).toBe(true);
        expect(error).toBe(undefined);
        expect(typeof listColumnType?.id).toBe("bigint");
    });

    it("save an invalid List Column Type", async function() {
        let [,error] = await listColumnTypeQuery(async () => new ListColumnType("a ListColumnType", intType, null).save());

        expect(error).not.toBe(undefined);

        [,error] = await listColumnTypeQuery(async () => new ListColumnType("", {}, list).save());
       
        expect(error).not.toBe(undefined);

        [,error] = await listColumnTypeQuery(async () => new ListColumnType("Valid Column", stringType, new List("Valid List", list.parentCollection)).save());

        expect(error).not.toBe(undefined);
    });

    it("save a duplicate List Column Type", async function() {
        const [,error] = await listColumnTypeQuery(async () => new ListColumnType("Categories", stringType, list).save());

        expect(error).not.toBe(undefined);
    });

    it("save a duplicate List Column Type to another list should work just fine", async function() {
        let [booksList, error] =
            await listColumnTypeQuery(async () => List.findByID(2));
        expect(error).toBe(undefined);
        expect(booksList instanceof List).toBe(true);

        [,error] = 
            await listColumnTypeQuery(async () => new ListColumnType("Categories", stringType, booksList).save());
        expect(error).toBe(undefined);
    });

    it("get a List Column Type from id", async function() {
        let [findListColumnType, error] = await listColumnTypeQuery(async () => ListColumnType.findByID(listColumnType.id));

        expect(findListColumnType instanceof ListColumnType).toBe(true);
        expect(error).toBe(undefined);
        expect(findListColumnType?.id).toBe(listColumnType.id);
        expect(typeof findListColumnType?.id).toBe("bigint");
        expect(findListColumnType?.name).toBe("A New ListColumnType");
        expect(findListColumnType?.type).toMatchObject(stringType);

        [findListColumnType, error] = await listColumnTypeQuery(async () => ListColumnType.findByID(0));

        expect(error).toBe(undefined);
        expect(findListColumnType).toBe(null);
    });

    it("update a List Column Type should work just fine", async function() {
        listColumnType.name = "Another List Column Type";
        listColumnType.type = intType;
        const [,error] = await listColumnTypeQuery(async () => listColumnType.save());
        expect(error).toBe(undefined);
    });

    it("delete a List Column Type", async function() {
        const [,error] = await listColumnTypeQuery(async () => ListColumnType.deleteFromID(listColumnType.id));
        expect(error).toBe(undefined);
    });

    it("delete invalid List Column Type", async function() {
        const [,error] = await listColumnTypeQuery(async () => ListColumnType.deleteFromID(600000000000000));
        expect(error).not.toBe(undefined);
    });

    it("test getCount", async function() {
        const [count, error] = 
            await listColumnTypeQuery(async () => ListColumnType.getCount(list.id));

        expect(error).toBe(undefined);
        expect(count).toBe(2n);
    });

    it("Get List Column Type from list", async function() {
        const [listsColumnType, error] = 
            await listColumnTypeQuery(async () => ListColumnType.findFromList(list));

        expect(listsColumnType.length).toBe(2);
        expect(listsColumnType[0] instanceof ListColumnType).toBe(true);
        expect(listsColumnType[1] instanceof ListColumnType).toBe(true);
    });

    describe("Test multiple List Column Type in a list", function() {
        let newList;
        const newListColumnType = [];
        let newCustomUserData;

        it("Create a new list", async function() {
            newList = new List("testing list", list.parentCollection);
            const [,error] = await listColumnTypeQuery(async () => newList.save());

            expect(error).toBe(undefined);
            expect(newList instanceof List).toBe(true);
        });

        it("Insert 3 ListColumnType", async function() {
            for (let i = 0; i < 3; i++) {
                const lct = new ListColumnType(`list_${i}`, stringType, newList);
                const [,error] = await listColumnTypeQuery(async () => lct.save());

                expect(error).toBe(undefined);
                expect(lct instanceof ListColumnType).toBe(true);

                newListColumnType.push(lct);
            }
        });

        it("Find ListColumnType from list", async function() {
            const [foundListsColumnType, error] =
                await listColumnTypeQuery(async () => ListColumnType.findFromList(newList));

            expect(error).toBe(undefined);
            expect(Array.isArray(foundListsColumnType)).toBe(true);
            expect(foundListsColumnType.length).toBe(3);
            expect(foundListsColumnType[0] instanceof ListColumnType).toBe(true);
            expect(foundListsColumnType[0].name).toBe("list_0");

            expect(foundListsColumnType[1] instanceof ListColumnType).toBe(true);
            expect(foundListsColumnType[1].name).toBe("list_1");

            expect(foundListsColumnType[2] instanceof ListColumnType).toBe(true);
            expect(foundListsColumnType[2].name).toBe("list_2");
        });

        it("add a custom user data", async function() {
            const newItem = new Item("item", null, list);
            let [,error] = await listColumnTypeQuery(async () => newItem.save());
            expect(error).toBe(undefined);

            newCustomUserData = new CustomRowsItems("customData", newItem.id, newListColumnType[0].id);
            [,error] = await listColumnTypeQuery(async () => newCustomUserData.save());
            expect(error).toBe(undefined);
        });

        it("find from userData", async function() {
            const [customList, error] =
                await listColumnTypeQuery(async () => ListColumnType.findFromUserData(newCustomUserData.id));
            expect(error).toBe(undefined);
            expect(typeof customList).toBe("object");
            expect(customList?.Name).toBe(newListColumnType[0].name);
        });

        it("delete from list", async function() {
            const [,error] =
                await listColumnTypeQuery(async () => ListColumnType.deleteFromList(newList.id));
            expect(error).toBe(undefined);
        });

        it("check if list column type are deleted", async function() {
            const [foundListsColumnType, error] =
                await listColumnTypeQuery(async () => ListColumnType.findFromList(newList));

            expect(error).toBe(undefined);
            expect(Array.isArray(foundListsColumnType)).toBe(true);
            expect(foundListsColumnType.length).toBe(0);
        });
    });
});

