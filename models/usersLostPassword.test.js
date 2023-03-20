require("../utils/testingEnv");
const mariadb = require("../sql/connection");
const seeds = require("../sql/seeds");
const { User } = require("./users");
const { UserLostPassword } = require("./usersLostPassword");

test("Create valid user lost password object", function() {
    const user = new User("abcd1", "email@provider.com", "12345", false);
    let userLost = new UserLostPassword(user);
    expect(user.isValid()).toBe(true);
    expect(userLost.isValid()).toBe(true);

    userLost = new UserLostPassword(user, 17n);
    expect(userLost.isValid()).toBe(true);

    userLost = new UserLostPassword(user, 17);
    expect(userLost.isValid()).toBe(true);

    userLost = new UserLostPassword(user, undefined, "78021cc4-2930-4882-8176-79f688d774fb");
    expect(userLost.isValid()).toBe(true);

    userLost = new UserLostPassword(user, undefined, undefined, new Date());
    expect(userLost.isValid()).toBe(true);

    userLost = new UserLostPassword(user, undefined, undefined, "2023-03-17 00:00:00");
    expect(userLost.isValid()).toBe(true);

    userLost = new UserLostPassword(user, undefined, undefined, "2023-03-17 00:00:00 UTC");
    expect(userLost.isValid()).toBe(true);
});

test("Create invallid user lost password object", function() {
    const user = new User("abcd1", "email@provider.com", "12345", false);
    let userLost = new UserLostPassword(new User());
    expect(userLost.isValid()).toBe(false);

    userLost = new UserLostPassword(null);
    expect(userLost.isValid()).toBe(false);

    userLost = new UserLostPassword(user, "Hello There");
    expect(() => userLost.isValid()).toThrow();

    userLost = new UserLostPassword(user, null);
    expect(() => userLost.isValid()).toThrow();

    userLost = new UserLostPassword(user, undefined, "abcd");
    expect(userLost.isValid()).toBe(false);

    userLost = new UserLostPassword(user, undefined, null);
    expect(userLost.isValid()).toBe(false);

    userLost = new UserLostPassword(user, undefined, undefined, null);
    expect(userLost.isValid()).toBe(false);

    userLost = new UserLostPassword(user, undefined, undefined, "Hello There");
    expect(userLost.isValid()).toBe(false);
});

test("Test UserLostPassword parseTime method", function() {
    let time = UserLostPassword.parseTime(new Date("2023-03-17 00:00:00 UTC"));
    //expect(time).toBe("2023-03-17 00:00:00");
});

describe("UserLostPassword database manipulation", function() {
    let user;

    beforeAll(async function() {
        mariadb.openPool("_testing");
        await seeds.seeds();
        user = await User.findByID(2);
    });

    afterAll(async function() {
        return mariadb.closePool();
    });

    async function lostUserQuery(func) {
        let error;
        let queryResult;

        try {
            queryResult = await func();
        } catch (err) {
            error = err;
        }

        return [queryResult, error];
    }

    let lostUser;

    it("save a lost user token", async function() {
        lostUser = new UserLostPassword(user, undefined, "78021cc4-2930-4882-8176-79f688d774fb", "2023-03-17 00:00:00");
        expect(lostUser.isValid()).toBe(true);
        
        const [,error] = await lostUserQuery(async () => lostUser.save());
        expect(error).toBe(undefined);
    });

    it("save an invalid user token", async function() {
        let [,error] = await lostUserQuery(async () => new UserLostPassword().save());
        expect(error).not.toBe(undefined);

        [,error] = await lostUserQuery(async () => new UserLostPassword(new User("sqdfm", "qdsmjfdsq", "dqsmjdsf", false)).save());
        expect(error).not.toBe(undefined);

        [,error] = await lostUserQuery(async () => new UserLostPassword(user, null).save());
        expect(error).not.toBe(undefined);

        [,error] = await lostUserQuery(async () => new UserLostPassword(user, undefined, 22).save());
        expect(error).not.toBe(undefined);

        [,error] = await lostUserQuery(async () => new UserLostPassword(user, undefined, "").save());
        expect(error).not.toBe(undefined);

        [,error] = await lostUserQuery(async () => new UserLostPassword(user, undefined, undefined, null).save());
        expect(error).not.toBe(undefined);

        [,error] = await lostUserQuery(async () => new UserLostPassword(user, undefined, undefined, "Hello").save());
        expect(error).not.toBe(undefined);
    });

    it("find a lost user data by token", async function() {
        const [lostUserData, error] = 
            await lostUserQuery(async () => UserLostPassword.findByToken(lostUser.token));
        expect(error).toBe(undefined);
        expect(lostUserData.token).toBe(lostUser.token);
        expect(lostUserData.id).toBe(lostUser.id);
        expect(lostUserData.parentUser.id).toBe(lostUser.parentUser.id);
        expect(lostUserData.time.toUTCString()).toBe(lostUser.time.toUTCString());
    });

    it("test deleting a lost user data token", async function() {
        const [,error] = 
            await lostUserQuery(async () => lostUser.delete());

        expect(error).toBe(undefined);
    });

    it("test delete expired token", async function() {
        const validDate = new UserLostPassword(user, undefined, undefined, new Date());
        const expiredDate = new UserLostPassword(user, undefined, undefined, new Date(Date.now() - 1000 * 60 * 5 /* Expired 5 minutes ago */));
        await validDate.save();
        await expiredDate.save();

        // Remove expired token
        await UserLostPassword.deleteExpiredToken();

        const [validToken, error] =
            await lostUserQuery(async () => UserLostPassword.findByToken(validDate.token));
        expect(error).toBe(undefined);
        expect(validToken instanceof UserLostPassword).toBe(true);
        expect(validToken.token).toBe(validDate.token);

        const [invalidToken, error2] =
            await lostUserQuery(async () => UserLostPassword.findByToken(expiredDate.token));
        expect(error).toBe(undefined);
        expect(invalidToken).toBe(null);
    });
});

