module.exports = {
  mode: "production",
  devtool: "inline-source-map",
  entry: "./src/app.tsx",
  output: {
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  externals: {
    react: 'React',
    "react-dom": 'react-dom'
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