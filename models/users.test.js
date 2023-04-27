require("../utils/testingEnv");
const mariadb = require("../sql/connection");
const seeds = require("../sql/seeds");
const { User } = require("./users");
const bigint = require("../utils/numbers/bigint");

test("Create valid user object", async function() {
    let user = new User("a_user", "some@email.com", "12345");
    user.id = 1;
    expect(user.isValid()).toBe(true);

    user = new User("1234", "some@email.com", "12345", false);
    user.id = 27;
    expect(user.isValid()).toBe(true);

    user = new User("1234", "some@email.com", "12345", false);
    expect(user.isValid()).toBe(true);

    user = new User("1234", "some@email.com", "12345", false);
    expect(user.isValid()).toBe(true);
});

test("Create user object with invalid invalid userID", async function() {
    let user = new User(null, "some@email.com", "12345", false);
    expect(user.isValid()).toBe(false);

    user = new User("", "some@email.com", "12345", false);
    expect(user.isValid()).toBe(false);

    user = new User("      ", "some@email.com", "12345", false);
    expect(user.isValid()).toBe(false);

    user = new User(NaN, "some@email.com", "12345", false);
    expect(user.isValid()).toBe(false);
});

test("Create user object with invalid email", async function() {
    let user = new User("1234", null, "12345", false);
    expect(user.isValid()).toBe(false);

    user = new User("1234", "", "12345", false);
    expect(user.isValid()).toBe(false);

    user = new User("1234", "         ", "12345", false);
    expect(user.isValid()).toBe(false);

    user = new User("1234", NaN, "12345", false);
    expect(user.isValid()).toBe(false);
});

test("Create user object with invalid password", async function() {
    let user = new User("1234", "some@email.com", null);
    expect(user.isValid()).toBe(false);

    user = new User("1234", "some@email.com", "");
    expect(user.isValid()).toBe(false);

    user = new User("1234", "some@email.com", "      ");
    expect(user.isValid()).toBe(false);

    user = new User("1234", "some@email.com", NaN);
    expect(user.isValid()).toBe(false);
});

test("Create user object with invalid id", async function() {
    let user = new User("1234", "some@email.com", "12345", false);
    user.id = "Hello There";
    expect(() => user.isValid()).toThrow();

    user.id = { id: 1 };
    expect(() => user.isValid()).toThrow();

    user.id = true;
    expect(() => user.isValid()).toThrow();

    user.id = false;
    expect(() => user.isValid()).toThrow();
});

describe("collection dabase manipulation", function() {
    beforeAll(async function() {
        mariadb.openPool("_testing");
        return seeds.seeds();
    });

    afterAll(async function() {
        return mariadb.closePool();
    });

    async function userQuery(func) {
        let error;
        let queryResult

        try {
            queryResult = await func();
        } catch (err) {
            error = err;
        }

        return [queryResult, error];
    }

    let user;

    it ("save a user", async function() {
        user = new User("user1234", "jlqsdfmjsdf@dqfqsjmdfdsq.com", "ave maria", false);
        const [,error] = await userQuery(async () => user.save());

        expect(user?.isValid()).toBe(true);
        expect(error).toBe(undefined);
        expect(typeof user?.id).toBe("bigint");
    });

    it("save an invalid user", async function() {
        let [,error] = await userQuery(async () => new User(null, "jjjlqsdfmjsdf@dqfqsjmdfdsq.com", "ave maria", false).save());

        expect(error).not.toBe(undefined);

        [,error] = await userQuery(async () => new User("user12345", null, "ave maria", false).save());
       
        expect(error).not.toBe(undefined);

        [,error] = await userQuery(async () => new User("user12345", "jjjlqsdfmjsdf@dqfqsjmdfdsq.com", null, false).save());
       
        expect(error).not.toBe(undefined);
    });

    it("save a duplicate user", async function() {
        const [,error] = await userQuery(async () => new User("user1234", "jlqsdfmjsdf@dqfqsjmdfdsq.com", "ave maria", false).save());

        expect(error).not.toBe(undefined);
    });

    it("get a user from id", async function() {
        let [findUser, error] = await userQuery(async () => User.findByID(user.id));

        expect(findUser instanceof User).toBe(true);
        expect(error).toBe(undefined);
        expect(findUser?.id).toBe(user.id);
        expect(typeof findUser?.id).toBe("bigint");
        expect(findUser?.username).toBe("user1234");
        expect(findUser?.email).toBe("jlqsdfmjsdf@dqfqsjmdfdsq.com");

        [findUser, error] = await userQuery(async () => User.findByID(0));

        expect(error).toBe(undefined);
        expect(findUser).toBe(null);
    });

    it("update a user", async function() {
        user.username = "a_new_username";
        const [,error] = await userQuery(async () => user.save());
        expect(error).toBe(undefined);
    });

    it("check updated user", async function() {
        const [findUser, error] =
            await userQuery(async () => User.findByID(user.id));

        expect(error).toBe(undefined);
        expect(findUser instanceof User).toBe(true);
        expect(typeof findUser?.id).toBe("bigint");
        expect(findUser?.id).toBe(user.id);
        expect(findUser.username).toBe("a_new_username");
        expect(findUser.email).toBe("jlqsdfmjsdf@dqfqsjmdfdsq.com");
    });

    it("check update invalid user", async function() {
        const updatedUser = new User(null, user.email, "1234", false);
        updatedUser.id = user.id;
        
        let [,error] = await userQuery(async () => updatedUser.save());

        expect(error).not.toBe(undefined);

        updatedUser.id = 2;
        updatedUser.username = "";

        [,error] = await userQuery(async () => updatedUser.save());

        expect(error).not.toBe(undefined);

        updatedUser.username = 25;

        [,error] = await userQuery(async () => updatedUser.save());

        expect(error).not.toBe(undefined);

        updatedUser.username = "aUser";
        updatedUser.email = "";

        [,error] = await userQuery(async () => updatedUser.save());

        expect(error).not.toBe(undefined);
        updatedUser.email = 25;

        [,error] = await userQuery(async () => updatedUser.save());

        expect(error).not.toBe(undefined);
    });

    it("update user to a duplicate value", async function() {
        const updatedUser = new User("BlueDragon28", "dragon@sisu.com", "1234", false);
        updatedUser.id = user.id;
        const [,error] = await userQuery(async () => updatedUser.save());
        expect(error).not.toBe(undefined);
    });

    it("get user by username or email", async function() {
        let [findUser, error] = await userQuery(async () => User.findByNameOrEmail("a_new_username"));
        expect(error).toBe(undefined);
        expect(findUser instanceof User).toBe(true);
        expect(findUser.username).toBe("a_new_username");

        [findUser, error] = await userQuery(async () => User.findByNameOrEmail("jlqsdfmjsdf@dqfqsjmdfdsq.com"));

        expect(error).toBe(undefined);
        expect(findUser instanceof User).toBe(true);
        expect(findUser.username).toBe("a_new_username");
    });

    it("get invalid user by username or email", async function() {
        let [findUser, error] = await userQuery(async () => User.findByNameOrEmail("abcd"));
        expect(error).toBe(undefined);
        expect(findUser).toBe(null);

        [findUser, error] = await userQuery(async () => User.findByNameOrEmail("blabla@blabla.blabla"));

        expect(error).toBe(undefined);
        expect(findUser).toBe(null);
    });

    it("delete a user", async function() {
        const [,error] = await userQuery(async () => User.deleteFromID(user.id));
        expect(error).toBe(undefined);
    });

    it("delete invalid user", async function() {
        const [,error] = await userQuery(async () => User.deleteFromID(600000000000000));
        expect(error).not.toBe(undefined);
    });

    it("create user with bypass restiction permission", async function() {
        user = new User("anDummyUsername", "adummy@email.com", "ave maria", false);
        user.bypassRestriction = true;
        const [,error] = await userQuery(async () => user.save());
        expect(error).toBe(undefined);
    });

    it("update user to not bypass restriction", async function() {
        user.bypassRestriction = false;
        const [,error] = await userQuery(async () => user.save());
        expect(error).toBe(undefined);
    });

    it("check if user is not bypassing restriction", async function() {
        const [isBypassing, error] = await userQuery(async () => User.isBypassingRestriction(user.id));
        expect(error).toBe(undefined);
        expect(isBypassing).toBe(false);
    });

    it("reenable user bypass restriction", async function() {
        user.bypassRestriction = true;
        const [,error] = await userQuery(async () => user.save());
        expect(error).toBe(undefined);
    });

    it("check if user is bypassing restriction", async function() {
        const [isBypassing, error] = await userQuery(async () => User.isBypassingRestriction(user.id));
        expect(error).toBe(undefined);
        expect(isBypassing).toBe(true);
    });

    it("set invalid user bypass restriction", async function() {
        user.bypassRestriction = null;
        let [,error] = await userQuery(async () => user.save());
        expect(error).not.toBe(undefined);

        user.bypassRestriction = "";
        [,error] = await userQuery(async () => user.save());
        expect(error).not.toBe(undefined);
    });

    it("insert invalid id to isBypassingRestriction", async function() {
        const [,error] = await userQuery(async () => User.isBypassingRestriction(null));
        expect(error).not.toBe(undefined);
    });

    it("check isAdmin option", async function() {
        const adminUser = new User("abcdefgh", "email@provider.com", "12345", false);
        adminUser.isAdmin = true;

        let [,error] = await userQuery(async () => adminUser.save());
        expect(error).toBe(undefined);
        expect(typeof adminUser.id).toBe("bigint");

        const isUserAdmin = await User.isAdmin(adminUser.id);
        expect(isUserAdmin).toBe(true);

        adminUser.isAdmin = false;
        [,error] = await userQuery(async () => adminUser.save());
        expect(error).toBe(undefined);

        const isUserNotAdmin = await User.isAdmin(adminUser.id);
        expect(isUserNotAdmin).toBe(false);
    })
});

