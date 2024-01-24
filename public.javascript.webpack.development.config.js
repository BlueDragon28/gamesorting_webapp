const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
  entry: "./public/javascript/webpackEntry.js",
  output: {
    path: path.resolve(__dirname, "public/dist"),
    filename: "public-js.bundle.2.1.0.js",
  },
  resolve: {
    roots: [
      path.resolve(__dirname, "public"),
      path.resolve(__dirname, "node_modules"),
    ],
  },
  devtool: false,
  module: {
    rules: [
      {
        test: /.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  optimization: {
    minimizer: [`...`, new CssMinimizerPlugin()],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "app.2.1.0.css",
    }),
  ],
};
