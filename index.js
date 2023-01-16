/*
Required packages and js files
*/
const path = require("path");
const express = require("express");
const ejsMate = require("ejs-mate");
const collectionsRouter = require("./routes/collections");
const listsRouter = require("./routes/lists");
const itemsRouter = require("./routes/items");
const methodOverride = require("method-override");

// Initializeing express
const app = express();

// Use EJS has a view engine
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true })); // parse body
app.use(methodOverride("_method")); // Allow the use of http verb not supported by web browsers

app.get("/", (req, res) => {
    res.render("index");
});

/*
Adding the collections routes
*/
app.use("/", collectionsRouter);

/*
Adding the lists routes
*/
app.use("/", listsRouter);

/*
Adding the items routes
*/
app.use("/", itemsRouter);

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