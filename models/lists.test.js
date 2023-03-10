const mariadb = require("../sql/connection");
const seeds = require("../sql/seeds");
const { Collection } = require("./collections");
const { List } = require("./lists");
const Pagination = require("../utils/sql/pagination");

let collection;

beforeAll(async function() {
    await mariadb.openPool();
    await seeds.seeds();
    collection = await Collection.findByID(1)
});

afterAll(async function() {
    return mariadb.closePool();
});

test("Create valid list object", async function() {
    let list = new List("ave maria", collection);
    list.id = 1;
    expect(list.isValid()).toBe(true);

    list = new List("a new list", collection);
    list.id = 27;
    expect(list.isValid()).toBe(true);

    list = new List("another list", collection);
    expect(list.isValid()).toBe(true);

    list = new List("A List", collection);
    expect(list.isValid()).toBe(true);
});

test("Create list object with invalid parent collection", async function() {
    let list = new List("A List", null);
    expect(list.isValid()).toBe(false);

    list = new List("A List", new Collection());
    expect(list.isValid()).toBe(false);

    list = new List("A List", NaN);
    expect(list.isValid()).toBe(false);
});

test("Create list object with invalid name", async function() {
    let list = new List(null, collection);
    expect(list.isValid()).toBe(false);

    list = new List("      ", collection);
    expect(list.isValid()).toBe(false);

    list = new List("", collection);
    expect(list.isValid()).toBe(false);

    list = new List(25, collection);
    expect(list.isValid()).toBe(false);
});

test("Create list object with invalid id", async function() {
    let list = new List("list", collection);
    list.id = "Hello There";
    expect(() => list.isValid()).toThrow();

    list.id = { id: 1 };
    expect(() => list.isValid()).toThrow();

    list.id = true;
    expect(() => list.isValid()).toThrow();

    list.id = false;
    expect(() => list.isValid()).toThrow();
});

describe("collection dabase manipulation", function() {
    async function listQuery(func) {
        let error;
        let queryResult

        try {
            queryResult = await func();
        } catch (err) {
            error = err;
        }

        return [queryResult, error];
    }

    let list;

    it ("save a list", async function() {
        list = new List("A New List", collection);
        const [,error] = await listQuery(async () => list.save());

        expect(list?.isValid()).toBe(true);
        expect(error).toBe(undefined);
        expect(typeof list?.id).toBe("bigint");
    });

    it("save an invalid list", async function() {
        let [,error] = await listQuery(async () => new List("a list", null).save());

        expect(error).not.toBe(undefined);

        [,error] = await listQuery(async () => new List("", collection).save());
       
        expect(error).not.toBe(undefined);

        [,error] = await listQuery(async () => new List("Valid List", new Collection(2, "Valid Collection")).save());

        expect(error).not.toBe(undefined);
    });

    it("save a duplicate list", async function() {
        const [,error] = await listQuery(async () => new List("Played Games", collection).save());

        expect(error).not.toBe(undefined);
    });

    it("save a duplicate list to another collection should work just fine", async function() {
        let [booksCollection, error] =
            await listQuery(async () => Collection.findByID(2));
        expect(error).toBe(undefined);
        expect(booksCollection instanceof Collection).toBe(true);

        [,error] = 
            await listQuery(async () => new List("Played Games", booksCollection).save());
        expect(error).toBe(undefined);
    });

    it("get a list from id", async function() {
        let [findList, error] = await listQuery(async () => List.findByID(list.id));

        expect(findList instanceof List).toBe(true);
        expect(error).toBe(undefined);
        expect(findList?.id).toBe(list.id);
        expect(typeof findList?.id).toBe("bigint");
        expect(findList?.name).toBe("A New List");

        [findList, error] = await listQuery(async () => List.findByID(0));

        expect(error).toBe(undefined);
        expect(findList).toBe(null);
    });

    it("update a list", async function() {
        list.name = "Another list";
        const [,error] = await listQuery(async () => list.save());
        expect(error).toBe(undefined);
    });

    it("check updated list", async function() {
        const [findList, error] =
            await listQuery(async () => List.findByID(list.id));

        expect(error).toBe(undefined);
        expect(findList instanceof List).toBe(true);
        expect(typeof findList?.id).toBe("bigint");
        expect(findList?.id).toBe(list.id);
        expect(findList.name).toBe("Another list");
        expect(findList.parentCollection.id).toBe(collection.id);
    });

    it("check update invalid list", async function() {
        const updatedList = new List(null, collection);
        updatedList.id = list.id;
        
        let [,error] = await listQuery(async () => updatedList.save());

        expect(error).not.toBe(undefined);

        updatedList.id = 2;
        updatedList.name = "";

        [,error] = await listQuery(async () => updatedList.save());

        expect(error).not.toBe(undefined);

        updatedList.name = 25;

        [,error] = await listQuery(async () => updatedList.save());

        expect(error).not.toBe(undefined);
    });

    it("update list to a duplicate value", async function() {
        const updatedList = new List("Played Games", collection);
        updatedList.id = list.id;
        const [,error] = await listQuery(async () => updatedList.save());
        expect(error).not.toBe(undefined);
    });

    it("check if user allowed", async function() {
        const [isUserAllowed, error] = 
            await listQuery(async () => List.isUserAllowed(2, list.id));
        expect(error).toBe(undefined);
        expect(isUserAllowed).toBe(true);
    });

    it("check if user not allowed", async function() {
        const [isUserAllowed, error] =
            await listQuery(async () => List.isUserAllowed(1, list.id));
        expect(error).toBe(undefined);
        expect(isUserAllowed).toBe(false);
    });

    it("delete a list", async function() {
        const [,error] = await listQuery(async () => List.deleteFromID(list.id));
        expect(error).toBe(undefined);
    });

    it("delete invalid list", async function() {
        const [,error] = await listQuery(async () => List.deleteFromID(600000000000000));
        expect(error).not.toBe(undefined);
    });

    it("test getCount", async function() {
        const [count, error] = 
            await listQuery(async () => List.getCount(collection));

        expect(error).toBe(undefined);
        expect(count).toBe(1n);
    });

    it("Get list from collection", async function() {
        const [lists, error] = 
            await listQuery(async () => List.findFromCollection(collection));

        expect(lists.length).toBe(2);
        expect(lists[0].length).toBe(1);
        expect(lists[1] instanceof Pagination).toBe(true);
        expect(lists[1].numberOfPages).toBe(1);
        expect(lists[1].currentPage).toBe(0);
        expect(lists[1].isValid).toBe(true);
    });

    it("insert 28 items", async function() {
        for (let i = 0; i < 28; i++) {
            const [,error] =
                await listQuery(async () => new List(`list_${i}`, collection).save());
            expect(error).toBe(undefined);
        }

        let [lists, error] = 
            await listQuery(async () => List.findFromCollection(collection, 1));

        expect(error).toBe(undefined);
        expect(lists.length).toBe(2);
        expect(lists[0].length).toBe(15);
        expect(lists[1].numberOfPages).toBe(2);
        expect(lists[1].currentPage).toBe(1);

        [lists, error] =
            await listQuery(async () => List.findFromCollection(collection, 2));

        expect(error).toBe(undefined);
        expect(lists.length).toBe(2);
        expect(lists[0].length).toBe(14);
        expect(lists[1].numberOfPages).toBe(2);
        expect(lists[1].currentPage).toBe(2);
    });
});

