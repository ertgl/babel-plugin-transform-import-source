/**
 * @import { type InputOptions } from "@babel/core";
 */

/**
 * @type {InputOptions}
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
