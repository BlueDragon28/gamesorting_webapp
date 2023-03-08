const mariadb = require("../sql/connection");
const seeds = require("../sql/seeds");
const { Collection } = require("./collections");
const Pagination = require("../utils/sql/pagination");

test("Create valid collection object", async function() {
    let col = new Collection(1, "A Collection");
    col.id = 1;
    expect(col.isValid()).toBe(true);

    col = new Collection(25, "col");
    col.id = 27;
    expect(col.isValid()).toBe(true);

    col = new Collection(31, "another col");
    expect(col.isValid()).toBe(true);

    col = new Collection(0, "A Collection");
    expect(col.isValid()).toBe(true);
});

test("Create collection object with invalid invalid userID", async function() {
    let col = new Collection(null, "A Collection");
    expect(col.isValid()).toBe(false);

    col = new Collection("invalid", "A Collection");
    expect(col.isValid()).toBe(false);

    col = new Collection(NaN, "A Collection");
    expect(col.isValid()).toBe(false);
});

test("Create collection object with invalid name", async function() {
    let col = new Collection(1, null);
    expect(col.isValid()).toBe(false);

    col = new Collection(1, "");
    expect(col.isValid()).toBe(false);

    col = new Collection(1, "       ");
    expect(col.isValid()).toBe(false);

    col = new Collection(1, 25);
    expect(col.isValid()).toBe(false);
});

test("Create collection object with invalid id", async function() {
    let col = new Collection(1, "collection");
    col.id = "Hello There";
    expect(() => col.isValid()).toThrow();

    col.id = { id: 1 };
    expect(() => col.isValid()).toThrow();

    col.id = true;
    expect(() => col.isValid()).toThrow();

    col.id = false;
    expect(() => col.isValid()).toThrow();
});

describe("collection dabase manipulation", function() {
    beforeAll(async function() {
        await mariadb.openPool();
        return seeds.seeds();
    });

    afterAll(async function() {
        return mariadb.closePool();
    });

    async function collectionQuery(func) {
        let error;
        let queryResult

        try {
            queryResult = await func();
        } catch (err) {
            error = err;
        }

        return [queryResult, error];
    }

    let collection;

    it ("save a collection", async function() {
        collection = new Collection(2, "A New Collection");
        const [,error] = await collectionQuery(async () => collection.save());

        expect(collection?.isValid()).toBe(true);
        expect(error).toBe(undefined);
        expect(typeof collection?.id).toBe("bigint");
    });

    it("save an invalid collection", async function() {
        let [,error] = await collectionQuery(async () => new Collection(null, "a col").save());

        expect(error).not.toBe(undefined);

        [,error] = await collectionQuery(async () => new Collection(2, "").save());
       
        expect(error).not.toBe(undefined);
    });

    it("save a duplicate collection", async function() {
        const [,error] = await collectionQuery(async () => new Collection(2, "Games").save());

        expect(error).not.toBe(undefined);
    });

    it("save a duplicate collection to another user should work just fine", async function() {
        const [,error] = 
            await collectionQuery(async () => new Collection(1, "Games").save());

        expect(error).toBe(undefined);
    });

    it("get a collection from id", async function() {
        let [findCollection, error] = await collectionQuery(async () => Collection.findByID(collection.id));

        expect(findCollection instanceof Collection).toBe(true);
        expect(error).toBe(undefined);
        expect(findCollection?.id).toBe(collection.id);
        expect(typeof findCollection?.id).toBe("bigint");
        expect(findCollection?.name).toBe("A New Collection");

        [findCollection, error] = await collectionQuery(async () => Collection.findByID(0));

        expect(error).toBe(undefined);
        expect(findCollection).toBe(null);
    });

    it("update a collection", async function() {
        collection.name = "Another collection";
        const [,error] = await collectionQuery(async () => collection.save());
        expect(error).toBe(undefined);
    });

    it("check updated collection", async function() {
        const [findCollection, error] =
            await collectionQuery(async () => Collection.findByID(collection.id));

        expect(error).toBe(undefined);
        expect(findCollection instanceof Collection).toBe(true);
        expect(typeof findCollection?.id).toBe("bigint");
        expect(findCollection?.id).toBe(collection.id);
        expect(findCollection.name).toBe("Another collection");
    });

    it("check update invalid collection", async function() {
        const updatedCollection = new Collection(null, collection.name);
        updatedCollection.id = collection.id;
        
        let [,error] = await collectionQuery(async () => updatedCollection.save());

        expect(error).not.toBe(undefined);

        updatedCollection.id = 2;
        updatedCollection.name = "";

        [,error] = await collectionQuery(async () => updatedCollection.save());

        expect(error).not.toBe(undefined);

        updatedCollection.name = 25;

        [,error] = await collectionQuery(async () => updatedCollection.save());

        expect(error).not.toBe(undefined);
    });

    it("update collection to a duplicate value", async function() {
        const updatedCollection = new Collection(collection.userID, "Games");
        updatedCollection.id = updatedCollection.id;
        const [,error] = await collectionQuery(async () => updatedCollection.save());
        expect(error).not.toBe(undefined);
    });

    it("check if user allowed", async function() {
        const [isUserAllowed, error] = 
            await collectionQuery(async () => Collection.isUserAllowed(2, collection.id));
        expect(error).toBe(undefined);
        expect(isUserAllowed).toBe(true);
    });

    it("check if user not allowed", async function() {
        const [isUserAllowed, error] =
            await collectionQuery(async () => Collection.isUserAllowed(1, collection.id));
        expect(error).toBe(undefined);
        expect(isUserAllowed).toBe(false);
    });

    it("delete a collection", async function() {
        const [,error] = await collectionQuery(async () => Collection.deleteFromID(collection.id));
        expect(error).toBe(undefined);
    });

    it("delete invalid collection", async function() {
        const [,error] = await collectionQuery(async () => Collection.deleteFromID(600000000000000));
        expect(error).not.toBe(undefined);
    });

    it("test getCount", async function() {
        const [count, error] = 
            await collectionQuery(async () => Collection.getCount(2));

        expect(error).toBe(undefined);
        expect(count).toBe(3n);
    });

    it("Get collections from userID", async function() {
        const [collections, error] = 
            await collectionQuery(async () => Collection.findFromUserID(2));

        expect(collections.length).toBe(2);
        expect(collections[0].length).toBe(3);
        expect(collections[1] instanceof Pagination).toBe(true);
        expect(collections[1].numberOfPages).toBe(1);
        expect(collections[1].currentPage).toBe(0);
        expect(collections[1].isValid).toBe(true);
    });

    it("insert 26 items", async function() {
        for (let i = 0; i < 26; i++) {
            const [,error] =
                await collectionQuery(async () => new Collection(2, `col_${i}`).save());
            expect(error).toBe(undefined);
        }

        let [collections, error] = 
            await collectionQuery(async () => Collection.findFromUserID(2, 1));

        expect(error).toBe(undefined);
        expect(collections.length).toBe(2);
        expect(collections[0].length).toBe(15);
        expect(collections[1].numberOfPages).toBe(2);
        expect(collections[1].currentPage).toBe(1);

        [collections, error] =
            await collectionQuery(async () => Collection.findFromUserID(2, 2));

        expect(error).toBe(undefined);
        expect(collections.length).toBe(2);
        expect(collections[0].length).toBe(14);
        expect(collections[1].numberOfPages).toBe(2);
        expect(collections[1].currentPage).toBe(2);
    });
});

