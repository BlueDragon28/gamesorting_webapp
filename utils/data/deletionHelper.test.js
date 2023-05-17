require("../testingEnv");
const mariadb = require("../../sql/connection");
const seeds = require("../../sql/seeds");
const {
    deleteCustomDatasFromListColumnType,
    deleteCustomDatasFromItemID,
    deleteCollection,
    deleteList,
    deleteItem,
    deleteUser
} = require("../data/deletionHelper");
const { User } = require("../../models/users");
const { Collection } = require("../../models/collections");
const { List } = require("../../models/lists");
const { Item } = require("../../models/items");
const { ListColumnType } = require("../../models/listColumnsType");
const { CustomRowsItems } = require("../../models/customUserData");
const { existingOrNewConnection } = require("../sql/sql");

let user;
let collection;
let list;
let item;
let listColumnType;
let customUserData;

beforeAll(async function() {
    mariadb.openPool("_testing");
});

afterAll(async function() {
    return mariadb.closePool();
});

beforeEach(async function() {
    await seeds.seeds();
    await existingOrNewConnection(undefined, async function(connection) {
        user = await User.findByID(2n, connection);
        collection = await Collection.findByID(1n, connection);
        list = await List.findByID(1n, connection);
        item = await Item.findByID(1n, connection);
        listColumnType = await ListColumnType.findByID(1n, connection);
        customUserData = await CustomRowsItems.findByID(1n, connection);
    });
});

async function delQuery(func) {
    let error;
    let queryResult;

    try {
        queryResult = await func();
    } catch (err) {
        error = err;
    }

    return [queryResult, error];
}

test("delete custom column of an item", async function() {
    expect(customUserData.isValid()).toBe(true);

    let [result, error] = await delQuery(() => customUserData.delete());
    expect(error).toBe(undefined);
    expect(result).toBe(undefined);

    // Check if deleted
    [result, error] = await delQuery(() => customUserData.findByID(customUserData.id));
    expect(error).not.toBe(undefined);
    expect(result).toBe(undefined);
});

test("delete all custom columns from an item", async function() {
    expect(item.isValid()).toBe(true);

    let [result, error] = await delQuery(() => CustomRowsItems.findFromItem(item.id));
    expect(error).toBe(undefined);
    expect(result?.length).toBe(1);

    [result, error] = await delQuery(() => deleteCustomDatasFromItemID(item.id));
    expect(error).toBe(undefined);
    expect(result).toBe(undefined);

    // Check if deleted
    [result, error] = await delQuery(() => CustomRowsItems.findFromItem(item.id));
    expect(error).toBe(undefined);
    expect(result?.length).toBe(0);
});

test("delete all custom columns from list column type", async function() {
    expect(listColumnType.isValid()).toBe(true);

    let [result, error] = await delQuery(() => CustomRowsItems.findFromListColumn(listColumnType.id));
    expect(error).toBe(undefined);
    expect(result?.length).toBe(2);

    [result, error] = await delQuery(() => deleteCustomDatasFromListColumnType(listColumnType.id));
    expect(error).toBe(undefined);
    expect(result).toBe(undefined);

    // Check if deleted
    [result, error] = await delQuery(() => CustomRowsItems.findFromListColumn(listColumnType.id));
    expect(error).toBe(undefined);
    expect(result?.length).toBe(0);
});

test("delete list column type", async function() {
    expect(listColumnType.isValid()).toBe(true);

    let [result, error] = await delQuery(() => listColumnType.delete());
    expect(error).toBe(undefined);
    expect(result).toBe(undefined);

    // Check if deleted
    [result, error] = await delQuery(() => ListColumnType.findByID(listColumnType.id));
    expect(error).toBe(undefined);
    expect(result).toBe(null);
});

test("delete an item", async function() {
    expect(item.isValid()).toBe(true);

    let [result, error] = await delQuery(() => CustomRowsItems.findFromItem(item.id));
    expect(error).toBe(undefined);
    expect(result?.length).toBe(1);

    [result, error] = await delQuery(() => deleteItem(item.id));
    expect(error).toBe(undefined);
    expect(result).toBe(undefined);

    [result, error] = await delQuery(() => CustomRowsItems.findFromItem(item.id));
    expect(error).toBe(undefined);
    expect(result?.length).toBe(0);

    [result, error] = await delQuery(() => Item.findByID(item.id));
    expect(error).toBe(undefined);
    expect(result).toBe(null);
});

test("delete list", async function() {
    expect(list.isValid()).toBe(true);

    let [result, error] = await delQuery(() => Item.findFromList(list));
    expect(error).toBe(undefined);
    expect(result[0]?.length).toBe(2);

    [result, error] = await delQuery(() => ListColumnType.findFromList(list));
    expect(error).toBe(undefined);
    expect(result?.length).toBe(2);

    [result, error] = await delQuery(() => deleteList(list.id));
    expect(error).toBe(undefined);
    expect(result).toBe(undefined);

    [result, error] = await delQuery(() => Item.findFromList(list));
    expect(error).toBe(undefined);
    expect(result[0]?.length).toBe(0);

    [result, error] = await delQuery(() => ListColumnType.findFromList(list));
    expect(error).toBe(undefined);
    expect(result?.length).toBe(0);

    [result, error] = await delQuery(() => List.findByID(list.id));
    expect(error).toBe(undefined);
    expect(result).toBe(null);
});

test("delete collection", async function() {
    expect(collection.isValid()).toBe(true);

    let [result, error] = await delQuery(() => List.findFromCollection(collection));
    expect(error).toBe(undefined);
    expect(result[0]?.length).toBe(1);

    [result, error] = await delQuery(() => deleteCollection(collection.id));
    expect(error).toBe(undefined);
    expect(result).toBe(undefined);

    [result, error] = await delQuery(() => Collection.findByID(collection.id));
    expect(error).toBe(undefined);
    expect(result).toBe(null);

    [result, error] = await delQuery(() => List.findFromCollection(collection));
    expect(error).toBe(undefined);
    expect(result[0]?.length).toBe(0);
});

test("delete user", async function() {
    expect(user.isValid()).toBe(true);

    let [result, error] = await delQuery(() => Collection.findFromUserID(user.id));
    expect(error).toBe(undefined);
    expect(result[0]?.length).toBe(3);

    [result, error] = await delQuery(() => deleteUser(user.id));
    expect(error).toBe(undefined);
    expect(result).toBe(undefined);

    [result, error] = await delQuery(() => User.findByID(user.id));
    expect(error).toBe(undefined);
    expect(result).toBe(null);

    [result, error] = await delQuery(() => Collection.findFromUserID(user.id));
    expect(error).toBe(undefined);
    expect(result[0]?.length).toBe(0);
});