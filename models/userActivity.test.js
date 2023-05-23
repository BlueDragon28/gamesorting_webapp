require("../utils/testingEnv");
const mariadb = require("../sql/connection");
const seeds = require("../sql/seeds");
const { UserActivity } = require("./userActivity");

test("Create valid user activity object", function() {
    let activity = new UserActivity(undefined, undefined, undefined);
    expect(activity.isValid()).toBe(true);

    activity.id = 17;
    expect(activity.isValid()).toBe(true);

    activity = new UserActivity(17);
    expect(activity.isValid()).toBe(true);

    activity = new UserActivity(undefined, "some type");
    expect(activity.isValid()).toBe(true);

    activity = new UserActivity(undefined, undefined, Date.now());
    expect(activity.isValid()).toBe(true);
});

test("Create invalid user activity object", function() {
    let activity = new UserActivity("Hello There");
    expect(activity.isValid()).toBe(false);

    activity = new UserActivity(undefined, "");
    expect(activity.isValid()).toBe(false);

    activity = new UserActivity(undefined, 46);
    expect(activity.isValid()).toBe(false);

    activity = new UserActivity(undefined, undefined, -1);
    expect(activity.isValid()).toBe(false);

    activity = new UserActivity();
    activity.id = "Hello There";
    expect(() => activity.isValid()).toThrow();
});

describe("user activity database manipulation", function() {
    beforeAll(async function() {
        mariadb.openPool("_testing");
        return seeds.seeds();
    });

    afterAll(async function() {
        return mariadb.closePool();
    });

    async function userActivityQuery(func) {
        let error;
        let queryResult;

        try {
            queryResult = await func();
        } catch (err) {
            error = err;
        }

        return [queryResult, error];
    }

    let userActivity;

    it("save user activity", async function() {
        userActivity = new UserActivity(1, "someType");
        const [,error] = await userActivityQuery(async () => userActivity.save());

        expect(userActivity.isValid()).toBe(true);
        expect(error).toBe(undefined);
        expect(typeof userActivity.id).toBe("bigint");
    });

    it("save invalid user activity", async function() {
        let [,error] = await userActivityQuery(async () => 
            new UserActivity("Hello", -1, "Hello").save());
        
        expect(error).not.toBe(undefined);

        [,error] = await userActivityQuery(async () => 
            new UserActivity(1, "type", "sqdlkfj").save());
        expect(error).not.toBe(undefined);
    });

    it("Get user activity from timelaps", async function() {
        const [foundUsersActivity, error] = await userActivityQuery(async () => 
            UserActivity.findByTimelapsFromNow(1));

        expect(error).toBe(undefined);

        for (const item of foundUsersActivity) {
            expect(item instanceof UserActivity).toBe(true);
            expect(item.id).toBe(userActivity.id);
            expect(item.userID).toBe(BigInt(userActivity.userID));
            expect(item.type).toBe(userActivity.type);
            expect(item.time).toBe(userActivity.time);
        }
    });

    it("Get unique user in activity from timelaps", async function() {
        const [uniqueUsers, error] = await userActivityQuery(async () =>
            UserActivity.findUniqueUsersFromTimelaps(1, 0));
        
        expect(error).toBe(undefined);
        expect(uniqueUsers).toBe(1n);
    });

    it("insert 10 user activity with 6 after 10 hours and 4 before 10 hours", async function() {
        async function insertActivity(time) {
            const [,error] = 
                await userActivityQuery(async () => await new UserActivity(undefined, undefined, time).save());
            
            expect(error).toBe(undefined);
        }

        const now = Date.now();
        const _15hours = now - (15 * 60 * 60 * 1000);
        const _5hours = now - (5 * 60 * 60 * 1000);

        for (let i = 0; i < 6; i++) {
            await insertActivity(_15hours);
        }

        for (let i = 0; i < 4; i++) {
            await insertActivity(_5hours);
        }
    });

    it("check number after 10 hours using findByTimelaps", async function() {
        const [foundActivies, error] = await userActivityQuery(async () => 
            UserActivity.findByTimelaps(20, 10));

        expect(error).toBe(undefined);
        expect(foundActivies?.length).toBe(6);
    });

    it("delete all activity after 10 hours", async function() {
        const _10hours = 10;

        const [numberDeleted,error] = 
            await userActivityQuery(async () => UserActivity.deleteAllAfterTimelaps(_10hours));
        
        expect(error).toBe(undefined);
        expect(numberDeleted).toBe(6);
    });

    it("there should be 5 remaining user activies", async function() {
        const [usersActivities,error] = await userActivityQuery(async () => 
            UserActivity.findByTimelapsFromNow(10));
        
        expect(error).toBe(undefined);
        expect(usersActivities.length).toBe(5);
    });

    it("but from only one user", async function() {
        const [uniqueUser, error] = await userActivityQuery(async () =>
            UserActivity.findUniqueUsersFromTimelaps(10, 0));
        
        // expect(error).toBe(undefined);
        // expect(uniqueUser).toBe(1n);
    });
});
