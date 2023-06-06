require("../utils/testingEnv");
const mariadb = require("../sql/connection");
const seeds = require("../sql/seeds");
const { List } = require("./lists");
const { ListSorting } = require("./listSorting");

let list;

beforeAll(async function() {
    mariadb.openPool("_testing");
    await seeds.seeds();
    list = await List.findByID(1);
});

afterAll(async function() {
    return mariadb.closePool();
});

test("create valid list sorting object", function() {
    let item = new ListSorting("no-sorting", list);
    expect(item.isValid()).toBe(true);

    item = new ListSorting("by-name", list);
    item.id = 5n;
    expect(item.isValid()).toBe(true);
});

test("create invalid list sorting object", function() {
    let item = new ListSorting("", list);
    expect(item.isValid()).toBe(false);

    item = new ListSorting(null, list);
    expect(item.isValid()).toBe(false);

    item = new ListSorting("no-sorting", null);
    expect(item.isValid()).toBe(false);
});

describe("listSorting database manipulation", function() {
    async function itemQuery(func) {
        let error;
        let queryResult;

        try {
            queryResult = await func();
        } catch (err) {
            error = err;
        }

        return [queryResult, error];
    }

    let listSorting;

    it("save listSorting item", async function() {
        listSorting = new ListSorting("no-sorting", list);
        const [,error] = await itemQuery(async () => listSorting.save());
        expect(error).toBe(undefined);
        expect(typeof listSorting.id).toBe("bigint");
        expect(listSorting.isValid()).toBe(true);
    });

    it("save invalid item", async function() {
        let [,error] = await itemQuery(async () => new ListSorting(null, list).save());
        expect(error).not.toBe(undefined);
    });

    it("find list sorting item from list and updating it", async function() {
        const [foundListSorting, error] = await itemQuery(async () => 
            ListSorting.findByList(list));

        expect(error).toBe(undefined);
        expect(foundListSorting instanceof ListSorting).toBe(true);
        expect(foundListSorting.isValid()).toBe(true);

        foundListSorting.type = "by-name";
        expect(foundListSorting.isValid()).toBe(true);

        const [,updateError] = await itemQuery(async () => foundListSorting.save());
        expect(updateError).toBe(undefined);

        const [foundUpdatedListSorting, newError] = await itemQuery(async () =>
            ListSorting.findByList(list));
        expect(newError).toBe(undefined);
        expect(foundUpdatedListSorting instanceof ListSorting).toBe(true);
        expect(foundUpdatedListSorting.isValid()).toBe(true);

        listSorting = foundUpdatedListSorting;
    });

    it("delete list sorting item", async function() {
        const [count, error] = await itemQuery(async () => 
            listSorting.delete());
        expect(error).toBe(undefined);
        expect(count).toBe(1);
    });

    it("save multiple version of list sorting to the same list and check if there is only one", async function() {
        let [result, error] = await itemQuery(() => new ListSorting("no-sorting", list).save());
        expect(error).toBe(undefined);

        [result, error] = await itemQuery(() => ListSorting.getCountFromList(list));
        expect(error).toBe(undefined);
        expect(result).toBe(1n);

        [result, error] = await itemQuery(() => new ListSorting("by-name", list).save());
        expect(error).toBe(undefined);
        
        [result, error] = await itemQuery(() => ListSorting.getCountFromList(list));
        expect(error).toBe(undefined);
        expect(result).toBe(1n);

        [result, error] = await itemQuery(() => ListSorting.findByList(list));
        expect(error).toBe(undefined);
        expect(result instanceof ListSorting);
        expect(result.isValid()).toBe(true);
        expect(result.type).toBe("by-name");
    });
});
