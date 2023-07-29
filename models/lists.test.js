require("../utils/testingEnv");
const mariadb = require("../sql/connection");
const seeds = require("../sql/seeds");
const { Collection } = require("./collections");
const { List } = require("./lists");
const Pagination = require("../utils/sql/pagination");
const { User } = require("./users");

let collection;

beforeAll(async function() {
    mariadb.openPool("_testing");
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

    it("find list by name from multiple connection", async function() {
        let [user, error] = await listQuery(async () => {
            const user = new User("abcdef", "abc@de.com", "12345", false);
            await user.save();
            return user;
        });
        expect(error).toBe(undefined);
        expect(user instanceof User).toBe(true);

        let [col, errorCol] = await listQuery(async () => {
            const col1 = new Collection(user.id, "col1");
            await col1.save();
            const col2 = new Collection(user.id, "col2");
            await col2.save();
            return [col1, col2];
        });
        expect(errorCol).toBe(undefined);
        expect(col[0] instanceof Collection).toBe(true);
        expect(col[1] instanceof Collection).toBe(true);

        let [lists, errorLists] = await listQuery(async () => {
            const list1 = new List("list1", col[0]);
            await list1.save();
            const list2 = new List("list2", col[0]);
            await list2.save();
            const list3 = new List("list3 exemple", col[1]);
            await list3.save();
            return [list1, list2, list3];
        });
        expect(errorLists).toBe(undefined);
        for (const list of lists) {
            expect(list instanceof List).toBe(true);
        }

        const [foundListWithoutSearchName, errorFoundList1] =
            await listQuery(() => List.findAllListFromUserByName(user));
        expect(errorFoundList1).toBe(undefined);
        expect(Array.isArray(foundListWithoutSearchName)).toBe(true);
        expect(foundListWithoutSearchName.length).toBe(3);
        for (const item of foundListWithoutSearchName) {
            expect(item instanceof List).toBe(true);
            expect(item.isValid()).toBe(true);
        }

        const [foundListWithListName, errorFoundList2] =
            await listQuery(() => List.findAllListFromUserByName(user, "list"));
        expect(errorFoundList2).toBe(undefined);
        expect(Array.isArray(foundListWithListName)).toBe(true);
        expect(foundListWithListName.length).toBe(3);
        for (const item of foundListWithListName) {
            expect(item instanceof List).toBe(true);
            expect(item.isValid()).toBe(true);
        }

        const [foundListWithExempleName, errorFoundList3] =
            await listQuery(() => List.findAllListFromUserByName(user, "exemple"));
        expect(errorFoundList3).toBe(undefined);
        expect(Array.isArray(foundListWithExempleName)).toBe(true);
        expect(foundListWithExempleName.length).toBe(1);
        for (const item of foundListWithExempleName) {
            expect(item instanceof List).toBe(true);
            expect(item.isValid()).toBe(true);
        }
    });
});

