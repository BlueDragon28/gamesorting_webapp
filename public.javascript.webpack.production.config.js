const path = require("path");

module.exports = {
    mode: "production",
    entry: "./public/javascript/webpackEntry.js",
    output: {
        path: path.resolve(__dirname, "public/dist"),
        filename: "public-js.bundle.1.0.0.js"
    },
    resolve: {
        roots: [path.resolve(__dirname, "public")]
    },
    devtool: false
}
