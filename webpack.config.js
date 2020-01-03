module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: "./src/app.ts",
  output: {
    filename: "bundle.js"
  },
  externals: 'readline', // TODO
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        // exclude: /(console\.ts$)|\/node_modules/,
        loader: "ts-loader"
      }
    ]
  }
};