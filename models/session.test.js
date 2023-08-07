require("../utils/testingEnv");
const mariadb = require("../sql/connection");
const { Session } = require("./session");

beforeAll(async function() {
    mariadb.openPool("_testing");
});

afterAll(async function() {
    return mariadb.closePool();
});

const session = new Session();

async function sessionQuery(func) {
    let error;
    let result;

    try {
        result = await func();
    } catch (err) {
        error = err;
    }

    return [result, error];
}

function sessionResponse(func) {
    return new Promise((resolve, reject) => {
        func((result, error) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        })
    });
}

it("save a session", async function() {
    const [result,error] = 
        await sessionQuery(() => sessionResponse((func) => {
            session.set("12345", {}, (err) => func(null, err));
        }));
    expect(result).toBeFalsy();
    expect(error).toBeFalsy();
});

it("get a session", async function() {
    await sessionQuery(() => sessionResponse((func) => {
        session.set("12345", {type:"true"}, (err) => func(null, err))
    }));

    const [result, error] = 
        await sessionQuery(() => sessionResponse((func) => {
            session.get("12345", (err, sess) => func(sess, err));
        }));

    expect(result).toMatchObject({type:"true"});
    expect(error).toBeFalsy();
});

it("delete all session", async function() {
    const [result, error] =
        await sessionQuery(() => sessionResponse((func) => {
            session.clear(err => func(null, err))
        }));

    expect(error).toBeFalsy();
    expect(result).toBeFalsy();
});

it("all sessions", async function() {
    for (let i = 0; i < 3; i++) {
        await sessionQuery(() => sessionResponse((func) => {
            session.set(`${i}`, {}, (err) => func(null, err));
        }));
    }

    const [result, error] =
        await sessionQuery(() => sessionResponse((func) => {
            session.all((err, data) => func(data, err))
        }));

    expect(error).toBeFalsy();
    expect(result.length).toBe(3);

    const [length, errorLength] =
        await sessionQuery(() => sessionResponse((func) => {
            session.length((err, data) => func(data, err))
        }));

    expect(errorLength).toBeFalsy();
    expect(length).toBe(3);
});

it("destroy session", async function() {
    const [result, error] = 
        await sessionQuery(() => sessionResponse((func) => {
            session.destroy("0", (err) => func(null, err))
        }));

    expect(result).toBeFalsy();
    expect(error).toBeFalsy();

    const [length, lengthError] =
        await sessionQuery(() => sessionResponse((func) => {
            session.length((err, data) => func(data, err));
        }));

    expect(lengthError).toBeFalsy();
    expect(length).toBe(2);
});

it("touch a session", async function() {
    const [result, error] = 
        await sessionQuery(() => sessionResponse((func) => {
            session.touch("1", {}, (err) => func(null, err))
        }));

    expect(result).toBeFalsy();
    expect(error).toBeFalsy();
});
