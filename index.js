/*
Required packages and js files
*/
const path = require("path");
const express = require("express");
const ejsMate = require("ejs-mate");
const collectionsRouter = require("./routes/collections");
const listsRouter = require("./routes/lists");
const itemsRouter = require("./routes/items");
const usersRouter = require("./routes/users");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const { parseFlashMessage } = require("./utils/flash/parseFlashMessage");
const { parseCelebrateError } = require("./utils/errors/celebrateErrorsMiddleware");

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true })); // parse body
app.use(methodOverride("_method")); // Allow the use of http verb not supported by web browsers

app.use(session({
    secret: "developmentonlysecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 3600 * 24 * 7
    }
}));
app.use(flash());
app.use(parseFlashMessage);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
});

app.use("/collections", collectionsRouter);
app.use("/collections/:collectionID", listsRouter);
app.use("/collections/:collectionID/lists/:listID", itemsRouter);
app.use("/users", usersRouter);

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
})

app.listen(8080, () => {
    console.log("Listing on port 8080");
});
