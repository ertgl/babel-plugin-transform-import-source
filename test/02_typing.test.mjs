/// <reference types="../dist/types/env.d.ts" />

import { test } from "node:test";

void test(
  "macro type definitions",
  (t) =>
  {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Static analysis only.
    return;

    /**
     * @type {(source: string) => string}
     */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Allow unreachable code.
    let _;

    // eslint-disable-next-line @typescript-eslint/unbound-method
    _ = require.transform;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/unbound-method
    _ = import.meta.transform;
  },
);
