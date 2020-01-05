module.exports = {
  mode: "development", // FIXME
  devtool: "inline-source-map",
  entry: "./src/app.tsx",
  output: {
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  }
};