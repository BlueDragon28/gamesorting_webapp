const { Store } = require("express-session");
const { existingOrNewConnection } = require("../utils/sql/sql");
const { SqlError } = require("../utils/errors/exceptions");

class Session extends Store {
  static _tableName = "session";
  static _oneDay = 86400;

  constructor() {
    super();
  }

  all(callback) {
    existingOrNewConnection(null, async function (connection) {
      const now = new Date().getTime();
      const queryStatement =
        "SELECT SessionID, Expire, SESS FROM session WHERE ? <= Expire";

      const queryArgs = [now];

      try {
        const queryResult = await connection.query(queryStatement, queryArgs);

        const sessionDatas = [];

        for (const data of queryResult) {
          sessionDatas.push(data.SESS);
        }

        callback(null, sessionDatas);
      } catch (err) {
        callback(err);
      }
    });
  }

  destroy(sid, callback) {
    existingOrNewConnection(null, async function (connection) {
      const queryStatement = "DELETE FROM session WHERE SessionID = ?";
      const queryArgs = [sid];

      try {
        await connection.query(queryStatement, queryArgs);
        callback();
      } catch (err) {
        callback(err);
      }
    });
  }

  clear(callback) {
    existingOrNewConnection(null, async function (connection) {
      const queryStatement = "DELETE FROM session";

      try {
        await connection.query(queryStatement);
        callback();
      } catch (err) {
        callback(err);
      }
    });
  }

  length(callback) {
    existingOrNewConnection(null, async function (connection) {
      const now = new Date().getTime();
      const queryStatement =
        "SELECT COUNT(*) AS count FROM session WHERE ? <= Expire";
      const queryArgs = [now];

      try {
        const queryResult = (
          await connection.query(queryStatement, queryArgs)
        )[0];
        callback(null, Number(queryResult.count));
      } catch (err) {
        callback(err);
      }
    });
  }

  get(sid, callback) {
    existingOrNewConnection(null, async function (connection) {
      const now = new Date().getTime();
      const queryStatement =
        "SELECT SessionID, Expire, SESS FROM session " +
        "WHERE ? = SessionID AND ? <= Expire";
      const queryArgs = [sid, now];

      try {
        const queryResult = await connection.query(queryStatement, queryArgs);

        if (!queryResult.length) {
          return callback();
        }

        const sess = queryResult[0].SESS;
        callback(null, sess);
      } catch (err) {
        callback(err);
      }
    });
  }

  set(sid, sess, callback) {
    existingOrNewConnection(null, async function (connection) {
      let expire = Session.getExpireDate(sess);

      const queryStatement =
        "INSERT INTO session(SessionID, Expire, SESS) " +
        "VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE " +
        "Expire = ?, SESS = ?";

      const queryArgs = [sid, expire, sess, expire, sess];

      try {
        await connection.query(queryStatement, queryArgs);
        callback();
      } catch (err) {
        callback(err);
      }
    });
  }

  touch(sid, sess, callback) {
    existingOrNewConnection(null, async function (connection) {
      let expire = Session.getExpireDate(sess);

      const queryStatement =
        "UPDATE session SET Expire = ? WHERE SessionID = ?";
      const queryArgs = [expire, sid];

      try {
        await connection.query(queryStatement, queryArgs);
        callback();
      } catch (err) {
        callback(err);
      }
    });
  }

  static getExpireDate(sess) {
    const now = new Date().getTime();
    let expire = now;
    if (sess && sess.cookie && sess.cookie.expires) {
      expire = Number(new Date(sess.cookie.expires));
    } else if (sess && sess.cookie && sess.cookie.maxAge) {
      expire = now + sess.cookie.maxAge;
    } else {
      expire = now + Session._oneDay;
    }
    return expire;
  }

  static async removeExpiredSessions(connection) {
    await existingOrNewConnection(connection, async function (connection) {
      const now = new Date().getTime();

      const queryStatement = "DELETE FROM session WHERE ? > Expire";
      const queryArgs = [now];

      try {
        await connection.query(queryStatement, queryArgs);
      } catch (err) {
        throw new SqlError(`Failed to delete expired sessions: ${err.message}`);
      }
    });
  }
}

module.exports = {
  Session,
};
