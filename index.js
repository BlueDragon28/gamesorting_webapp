/*
Required packages and js files.
*/
const express = require("express");

// Initializeing express.
const app = express();

app.get("/", (req, res) => {
    res.send("<h1>GameSorting index!</h1>");
});

app.listen(8080, () => {
    console.log("Listing on port 8080");
});