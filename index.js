// Only include dotenv in development mode
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
} else {
    require("./utils/loadingEnvVariable").getEnvValueFromFile(
        process.env.ENV_VAR_FILE
    );
}

/*
Required packages and js files
*/
const path = require("path");
const express = require("express");
const http = require("http");
const { configureHelmet } = require("./utils/security/basicSecurity");
const ejsMate = require("ejs-mate");
const collectionsRouter = require("./routes/collections");
const listsRouter = require("./routes/lists");
const itemsRouter = require("./routes/items");
const usersRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
const methodOverride = require("method-override");
const { default: RedisStore } = require("connect-redis");
const session = require("express-session");
const { createClient } = require("redis");
const flash = require("connect-flash");
const { parseFlashMessage } = require("./utils/flash/parseFlashMessage");
const { parseCelebrateError } = require("./utils/errors/celebrateErrorsMiddleware");
const mariadb = require("./sql/connection");
const { activate: activateTask, deactivate: deactiveTask } = require("./utils/automaticTasks/automaticTask");
const userActivitiesMiddleware = require("./utils/users/activities");

mariadb.openPool();

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.disable("x-powered-by"); // X-Powered-By http header indicate what web server is currently be used

configureHelmet(app); // Add the middleware of helmets
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // parse body
app.use(methodOverride("_method")); // Allow the use of http verb not supported by web browsers


const redisClient = createClient({
    url: process.env.REDIS_URL
});
redisClient.connect().catch(console.err);

const redisStore = new RedisStore({
    client: redisClient,
    prefix: "gamesorting_webapp"
});

const secureCookie = process.env.NODE_ENV === "production";
app.use(session({
    name: "sessionID",
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: redisStore,
    cookie: {
        secure: secureCookie,
        httpOnly: true,
        maxAge: 1000 * 3600 * 24 * 7
    }
}));
app.use(flash());
app.use(parseFlashMessage);
app.use(function(req, res, next) {
    res.locals.currentUser = req.session.user;
    res.locals.activeLink = "";
    next();
});

app.use(userActivitiesMiddleware);

app.get("/", (req, res) => {
    res.render("index");
});

app.use("/collections", collectionsRouter);
app.use("/collections/:collectionID", listsRouter);
app.use("/collections/:collectionID/lists/:listID", itemsRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter);

/*
Parsing celebrate errors
*/
app.use(parseCelebrateError);

/*
Error handler. Every time an error is catch by express, this middleware is called.
*/
app.use((err, req, res, next) => {
    const { statusCode = 500, 
        message = "Oups, Something Went Wrong!",
        stack } = err;
    
    res.status(statusCode).send("<p>" + message + (stack ? ("<br>" + stack) : "") + "</p>");
});

const server = http.createServer(app);
server.listen(process.env.LISTENING_PORT);

async function closeServer() {
    server.close();
    await mariadb.closePool();
    await redisClient.disconnect();
    deactiveTask();

    if (process.env.NODE_ENV !== "production") {
        console.log("server has been closed!");
    }
};

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);

activateTask();
