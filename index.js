/*
Required packages and js files
*/
const path = require("path");
const express = require("express");
const collectionsRoute = require("./routes/collections");

// Initializeing express
const app = express();

// Use EJS has a view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true })); // parse body

app.get("/", (req, res) => {
    res.send("<h1>GameSorting index!</h1>");
});

/*
Adding the collections routes
*/
collectionsRoute(app);

app.listen(8080, () => {
    console.log("Listing on port 8080");
});