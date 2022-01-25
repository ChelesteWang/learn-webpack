const path = require("path");

const HelloWorldPlugin = require("./plugin/hello-world-plugin");
const ListDepPlugin = require("./plugin/simple-html-plugin");

module.exports = {
  entry: "./src/index.js",
  mode: "development",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js/,
        use: [
          {
            loader: path.resolve(
              __dirname,
              "./loader/add-annotation-loader.js"
            ),
            options: {
              author: "ChelesteWang",
              date: new Date(),
            },
          },
          {
            loader: path.resolve(__dirname, "./loader/clear-console-loader.js"),
          },
        ],
      },
    ],
  },
  plugins: [new HelloWorldPlugin(), new ListDepPlugin({
    output:"main.js",
    mode:'development'
  })],
};
