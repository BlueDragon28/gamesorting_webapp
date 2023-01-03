/*
Required packages and js files
*/
const path = require("path");
const express = require("express");
const collectionsRoute = require("./routes/collections");
const listsRoute = require("./routes/lists");
const itemsRoute = require("./routes/items");
const methodOverride = require("method-override");

// Initializeing express
const app = express();

// Use EJS has a view engine
app.use(ejsLayout);
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true })); // parse body
app.use(methodOverride("_method")); // Allow the use of http verb not supported by web browsers

app.get("/", (req, res) => {
    res.send("<h1>GameSorting index!</h1>");
});

/*
Adding the collections routes
*/
collectionsRoute(app);

/*
Adding the lists routes
*/
listsRoute(app);

/*
Adding the items routes
*/
itemsRoute(app);

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