"use strict";

const path = require("path");

/** @type {import('webpack').Configuration[]} */
module.exports = [
  // ── Extension bundle (runs in Node.js) ──────────────────────────────────
  {
    name: "extension",
    target: "node",
    mode: "none",
    entry: "./src/extension.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "extension.js",
      libraryTarget: "commonjs2",
    },
    externals: {
      vscode: "commonjs vscode",
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
            options: { configFile: "tsconfig.ext.json" },
          },
        },
      ],
    },
    devtool: "nosources-source-map",
    infrastructureLogging: { level: "log" },
  },

  // ── WebView bundle (runs in the browser sandbox) ─────────────────────────
  {
    name: "webview",
    target: "web",
    mode: "none",
    entry: "./webview-src/viewer.ts",
    output: {
      path: path.resolve(__dirname, "media"),
      filename: "viewer.js",
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
            options: { configFile: "tsconfig.webview.json" },
          },
        },
      ],
    },
    devtool: "nosources-source-map",
    performance: { hints: false },
  },
];
