/**
 * @import { type TransformOptions } from "@babel/core";
 *
 * @import { type Options as ImportSourceTransformerPluginOptions } from "./src";
 */

const TARGET_EXTENSION = ".mjs";

/**
 * @type {ImportSourceTransformerPluginOptions}
 */
const importSourceTransformerPluginOptions = {
  transform: {
    rules: [
      {
        find: /(?:\.[cm]?[jt]s[x]?)?$/iu,
        replace: TARGET_EXTENSION,
        resolveIndex: true,
        test: /^[.\\/]+.*$/,
      },
    ],
  },
};

/**
 * @type {TransformOptions}
 */
module.exports = {
  plugins: [
    [
      // Available after the bootstrap phase.
      require.resolve("./bootstrap/index.js"),
      importSourceTransformerPluginOptions,
    ],
  ],

  presets: [
    [
      require.resolve("@babel/preset-env"),
      {
        modules: false,
      },
    ],

    [
      require.resolve("@babel/preset-typescript"),
      {},
    ],
  ],

  sourceMaps: true,
};
