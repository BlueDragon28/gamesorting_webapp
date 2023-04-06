require("../utils/testingEnv");
const mariadb = require("../sql/connection");
const seeds = require("../sql/seeds");
const { List } = require("./lists");
const { Item } = require("./items");
const Pagination = require("../utils/sql/pagination");

let list;

beforeAll(async function() {
    mariadb.openPool("_testing");
    await seeds.seeds();
    list = await List.findByID(1)
});

afterAll(async function() {
    return mariadb.closePool();
});

test("Create valid item object", async function() {
    let item = new Item("ave maria", null, list);
    item.id = 1;
    expect(item.isValid()).toBe(true);

    item = new Item("a new item", "https://www.dymmysite.com", list);
    item.id = 27;
    expect(item.isValid()).toBe(true);

    item = new Item("another item", "", list);
    expect(item.isValid()).toBe(true);

    item = new Item("A Item", null, list);
    expect(item.isValid()).toBe(true);
});

test("Create item object with invalid parent list", async function() {
    let item = new Item("A Item", null, null);
    expect(item.isValid()).toBe(false);

    item = new Item("A Item", null, new List());
    expect(item.isValid()).toBe(false);

    item = new Item("A Item", null, NaN);
    expect(item.isValid()).toBe(false);
});

test("Create list object with invalid name", async function() {
    let item = new Item(null, null, list);
    expect(item.isValid()).toBe(false);

    item = new Item("      ", null, list);
    expect(item.isValid()).toBe(false);

    item = new Item("", null, list);
    expect(item.isValid()).toBe(false);

    item = new Item(25, null, list);
    expect(item.isValid()).toBe(false);
});

test("Create item object with invalid id", async function() {
    let item = new Item("item", null, list);
    item.id = "Hello There";
    expect(() => item.isValid()).toThrow();

    item.id = { id: 1 };
    expect(() => item.isValid()).toThrow();

    item.id = true;
    expect(() => item.isValid()).toThrow();

    item.id = false;
    expect(() => item.isValid()).toThrow();
});

describe("collection dabase manipulation", function() {
    async function itemQuery(func) {
        let error;
        let queryResult

        try {
            queryResult = await func();
        } catch (err) {
            error = err;
        }

        return [queryResult, error];
    }

    let item;

    it ("save an item", async function() {
        item = new Item("A New Item", "https://www.dymmysite.com", list);
        item.rating = 5;
        const [,error] = await itemQuery(async () => item.save());

        expect(item?.isValid()).toBe(true);
        expect(error).toBe(undefined);
        expect(typeof item?.id).toBe("bigint");
    });

    it("save an invalid item", async function() {
        let [,error] = await itemQuery(async () => new Item("an item", null, null).save());

        expect(error).not.toBe(undefined);

        [,error] = await itemQuery(async () => new Item("", null, list).save());
       
        expect(error).not.toBe(undefined);

        [,error] = await itemQuery(async () => new Item("Valid Item", null, new List("Valid List", list.parentCollection)).save());

        expect(error).not.toBe(undefined);
    });

    it("save a duplicate item", async function() {
        const [,error] = await itemQuery(async () => new Item("Battlefield 4", null, list).save());

        expect(error).not.toBe(undefined);
    });

    it("save a duplicate item to another list should work just fine", async function() {
        let [booksList, error] =
            await itemQuery(async () => List.findByID(2));
        expect(error).toBe(undefined);
        expect(booksList instanceof List).toBe(true);

        [,error] = 
            await itemQuery(async () => new Item("Battlefield 4", null, booksList).save());
        expect(error).toBe(undefined);
    });

    it("get an item from id", async function() {
        let [findItem, error] = await itemQuery(async () => Item.findByID(item.id));

        expect(findItem instanceof Item).toBe(true);
        expect(error).toBe(undefined);
        expect(findItem?.id).toBe(item.id);
        expect(typeof findItem?.id).toBe("bigint");
        expect(findItem?.name).toBe("A New Item");
        expect(findItem?.url).toBe("https://www.dymmysite.com");
        expect(findItem.parentList instanceof List).toBe(true);
        expect(findItem.rating).toBe(5);

        [findItem, error] = await itemQuery(async () => Item.findByID(0));

        expect(error).toBe(undefined);
        expect(findItem).toBe(null);
    });

    it("update an item", async function() {
        item.name = "Another item";
        item.rating = 4;
        const [,error] = await itemQuery(async () => item.save());
        expect(error).toBe(undefined);
    });

    it("check updated item", async function() {
        const [findItem, error] =
            await itemQuery(async () => Item.findByID(item.id));

        expect(error).toBe(undefined);
        expect(findItem instanceof Item).toBe(true);
        expect(typeof findItem?.id).toBe("bigint");
        expect(findItem?.id).toBe(item.id);
        expect(findItem.name).toBe("Another item");
        expect(findItem.parentList.id).toBe(list.id);
        expect(findItem.rating).toBe(4);
    });

    it("check update invalid item", async function() {
        const updatedItem = new Item(null, null, list);
        updatedItem.id = item.id;
        
        let [,error] = await itemQuery(async () => updatedItem.save());

        expect(error).not.toBe(undefined);

        updatedItem.id = 2;
        updatedItem.name = "";

        [,error] = await itemQuery(async () => updatedItem.save());

        expect(error).not.toBe(undefined);

        updatedItem.name = 25;

        [,error] = await itemQuery(async () => updatedItem.save());

        expect(error).not.toBe(undefined);
    });

    it("update item to a duplicate value", async function() {
        const updatedItem = new List("Battlefield 4", null, list);
        updatedItem.id = item.id;
        const [,error] = await itemQuery(async () => updatedItem.save());
        expect(error).not.toBe(undefined);
    });

    it("check if user allowed", async function() {
        const [isUserAllowed, error] = 
            await itemQuery(async () => Item.isUserAllowed(2, item.id));
        expect(error).toBe(undefined);
        expect(isUserAllowed).toBe(true);
    });

    it("check if user not allowed", async function() {
        const [isUserAllowed, error] =
            await itemQuery(async () => Item.isUserAllowed(1, item.id));
        expect(error).toBe(undefined);
        expect(isUserAllowed).toBe(false);
    });

    it("delete an item", async function() {
        const [,error] = await itemQuery(async () => Item.deleteFromID(item.id));
        expect(error).toBe(undefined);
    });

    it("delete invalid item", async function() {
        const [,error] = await itemQuery(async () => Item.deleteFromID(600000000000000));
        expect(error).not.toBe(undefined);
    });

    it("test getCount", async function() {
        const [count, error] = 
            await itemQuery(async () => Item.getCount(list));

        expect(error).toBe(undefined);
        expect(count).toBe(2n);
    });

    it("Get items from list", async function() {
        const [items, error] = 
            await itemQuery(async () => Item.findFromList(list));

        expect(items.length).toBe(2);
        expect(items[0].length).toBe(2);
        expect(items[1] instanceof Pagination).toBe(true);
        expect(items[1].numberOfPages).toBe(1);
        expect(items[1].currentPage).toBe(0);
        expect(items[1].isValid).toBe(true);
    });

    it("insert 27 items", async function() {
        for (let i = 0; i < 27; i++) {
            const [,error] =
                await itemQuery(async () => new Item(`item_${i}`, "someUrl", list).save());
            expect(error).toBe(undefined);
        }

        let [items, error] = 
            await itemQuery(async () => Item.findFromList(list, 1));

        expect(error).toBe(undefined);
        expect(items.length).toBe(2);
        expect(items[0].length).toBe(15);
        expect(items[1].numberOfPages).toBe(2);
        expect(items[1].currentPage).toBe(1);

        [items, error] =
            await itemQuery(async () => Item.findFromList(list, 2));

        expect(error).toBe(undefined);
        expect(items.length).toBe(2);
        expect(items[0].length).toBe(14);
        expect(items[1].numberOfPages).toBe(2);
        expect(items[1].currentPage).toBe(2);
    });
});

