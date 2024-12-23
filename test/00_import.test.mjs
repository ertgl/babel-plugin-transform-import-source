import { strictEqual } from "node:assert";
import { test } from "node:test";

void test(
  "importing the plugin",
  async (t) =>
  {
    const {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Available after build.
      plugin,
    } = await import("babel-plugin-transform-import-source");

    strictEqual(typeof plugin, "function");
  },
);
