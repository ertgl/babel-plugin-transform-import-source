/**
 * @import { type TransformOptions } from "@babel/core";
 */

/**
 * @type {TransformOptions}
 */
module.exports = {
  presets: [
    [
      require.resolve("@babel/preset-env"),
      {
        modules: "commonjs",
      },
    ],

    [
      require.resolve("@babel/preset-typescript"),
      {},
    ],
  ],

  sourceMaps: true,
};
