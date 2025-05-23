import { strictEqual } from "node:assert";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import {
  before,
  mock,
  test,
} from "node:test";
import { fileURLToPath } from "node:url";

import { transformSync } from "@babel/core";

/**
 * @import { Mock } from "node:test";
 *
 * @import {
 *   type Options as ImportSourceTransformerPluginOptions,
 *   type TransformationRule,
 *   type Transformer,
 * } from "../src/index.js";
 */

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);

/**
 * @param {string} code
 * @param {string} targetExtension
 * @param {Transformer | null} [transformer]
 * @param {Partial<TransformationRule> | null} [ruleOverrides]
 * @returns {string}
 */
function transpileCode(
  code,
  targetExtension,
  transformer,
  ruleOverrides,
)
{
  /**
   * @type {ImportSourceTransformerPluginOptions}
   */
  const importSourceTransformerPluginOptions = {
    moduleMethods: {
      transformImportSource: {
        importMeta: {
          propertyName: "$transform",
        },
        require: {
          propertyName: "$transform",
        },
      },
    },
    transform: {
      rules: [
        {
          find: /(?:\.[cm]?[jt]s[x]?)?$/iu,
          replace: targetExtension,
          test: /^[.\\/]+.*$/iu,
          ...ruleOverrides,
          resolveIndex: (
            ruleOverrides?.resolveIndex
            ?? {
              fallback: "index",
            }
          ),
        },
      ],
    },
    transformer,
  };

  const result = transformSync(
    code,
    {
      babelrc: false,
      babelrcRoots: false,
      browserslistConfigFile: false,
      configFile: false,
      cwd: __dirname,
      filename: __filename,
      plugins: [
        [
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Available after build.
          require(".."),
          importSourceTransformerPluginOptions,
        ],
      ],
      root: __dirname,
      sourceType: "unambiguous",
    },
  );

  return result?.code ?? "";
}

const EXTENSIONS = [
  "",
  ...[
    ".cjs",
    ".cts",
    ".js",
    ".mjs",
    ".mts",
    ".ts",
  ].flatMap(
    (extension) =>
    {
      return [
        extension,
        `${extension}x`,
      ];
    },
  ),
];

const CASES = [
  ...EXTENSIONS.flatMap(
    (sourceExtension) =>
    {
      return EXTENSIONS.map(
        (targetExtension) =>
        {
          return {
            isDirectory: false,
            isFile: true,
            isFixture: false,
            sourceExtension,
            sourceImport: `./fixtures/foo${sourceExtension}`,
            targetExtension,
            targetImport: `./fixtures/foo${targetExtension}`,
          };
        },
      );
    },
  ),

  {
    isDirectory: false,
    isFile: true,
    isFixture: true,
    sourceExtension: "",
    sourceImport: `./fixtures/bar`,
    targetExtension: ".cjs",
    targetImport: `./fixtures/bar.cjs`,
  },
  {
    isDirectory: false,
    isFile: true,
    isFixture: true,
    sourceExtension: "",
    sourceImport: `./fixtures/foo`,
    targetExtension: ".mjs",
    targetImport: `./fixtures/foo.mjs`,
  },
  {
    isDirectory: true,
    isFile: false,
    isFixture: true,
    sourceExtension: "",
    sourceImport: `./fixtures`,
    targetExtension: ".mjs",
    targetImport: `./fixtures/index.mjs`,
  },
];

before(
  () =>
  {
    console.debug(
      `Checking ${String(CASES.length)} cases for each scenario...`,
    );
  },
);

void test(
  "transforming require",
  (t) =>
  {
    CASES.forEach(
      (case_) =>
      {
        const source = `require("${case_.sourceImport}");`;
        const expected = `require("${case_.targetImport}");`;

        const transpiled = transpileCode(
          source,
          case_.targetExtension,
        );

        strictEqual(transpiled, expected);
      },
    );
  },
);

void test(
  "transforming require.transform (macro/module-method)",
  (t) =>
  {
    CASES.forEach(
      (case_) =>
      {
        const source = `require.$transform("${case_.sourceImport}");`;
        const expected = `"${case_.targetImport}";`;

        const transpiled = transpileCode(
          source,
          case_.targetExtension,
        );

        strictEqual(transpiled, expected);
      },
    );
  },
);

void test(
  "transforming dynamic import",
  (t) =>
  {
    CASES.forEach(
      (case_) =>
      {
        const source = `import("${case_.sourceImport}");`;
        const expected = `import("${case_.targetImport}");`;

        const transpiled = transpileCode(
          source,
          case_.targetExtension,
        );

        strictEqual(transpiled, expected);
      },
    );
  },
);

void test(
  "transforming static import default",
  (t) =>
  {
    CASES.forEach(
      (case_) =>
      {
        const source = `import ns from "${case_.sourceImport}";`;
        const expected = `import ns from "${case_.targetImport}";`;

        const transpiled = transpileCode(
          source,
          case_.targetExtension,
        );

        strictEqual(transpiled, expected);
      },
    );
  },
);

void test(
  "transforming static import named",
  (t) =>
  {
    CASES.forEach(
      (case_) =>
      {
        const source = `import { named } from "${case_.sourceImport}";`;
        const expected = `import { named } from "${case_.targetImport}";`;

        const transpiled = transpileCode(
          source,
          case_.targetExtension,
        );

        strictEqual(transpiled, expected);
      },
    );
  },
);

void test(
  "transforming static export all",
  (t) =>
  {
    CASES.forEach(
      (case_) =>
      {
        const source = `export * from "${case_.sourceImport}";`;
        const expected = `export * from "${case_.targetImport}";`;

        const transpiled = transpileCode(
          source,
          case_.targetExtension,
        );

        strictEqual(transpiled, expected);
      },
    );
  },
);

void test(
  "transforming static export named",
  (t) =>
  {
    CASES.forEach(
      (case_) =>
      {
        const source = `export { named } from "${case_.sourceImport}";`;
        const expected = `export { named } from "${case_.targetImport}";`;

        const transpiled = transpileCode(
          source,
          case_.targetExtension,
        );

        strictEqual(transpiled, expected);
      },
    );
  },
);

void test(
  "transforming import.meta.transform (macro/module-method)",
  (t) =>
  {
    CASES.forEach(
      (case_) =>
      {
        const source = `import.meta.$transform("${case_.sourceImport}");`;
        const expected = `"${case_.targetImport}";`;

        const transpiled = transpileCode(
          source,
          case_.targetExtension,
        );

        strictEqual(transpiled, expected);
      },
    );
  },
);

void test(
  "custom transformer",
  async (t) =>
  {
    const {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Available after build.
      createDefaultTransformer,
    } = await import("babel-plugin-transform-import-source");

    /**
     * @type {Mock<Transformer>}
     */
    const transformer = mock.fn(createDefaultTransformer());

    CASES.forEach(
      (case_) =>
      {
        const source = `import("${case_.sourceImport}");`;

        transpileCode(
          source,
          case_.targetExtension,
          transformer,
        );
      },
    );

    strictEqual(transformer.mock.callCount(), CASES.length);
  },
);

void test(
  "magic comments",
  (t) =>
  {
    CASES.forEach(
      (case_) =>
      {
        const statements = [
          [
            "// @babel-plugin-transform-import-source-ignore",
            `import ns from "${case_.sourceImport}";`,
          ].join("\n"),

          [
            "// @babel-plugin-transform-import-source-ignore",
            `import { named } from "${case_.sourceImport}";`,
          ].join("\n"),

          [
            "// @babel-plugin-transform-import-source-ignore",
            `import "${case_.sourceImport}";`,
          ].join("\n"),

          [
            "import(",
            "// @babel-plugin-transform-import-source-ignore",
            `"${case_.sourceImport}");`,
          ].join("\n"),

          [
            "require(",
            "// @babel-plugin-transform-import-source-ignore",
            `"${case_.sourceImport}");`,
          ].join("\n"),
        ];

        statements.forEach(
          (statement) =>
          {
            const transpiled = transpileCode(
              statement,
              case_.targetExtension,
            );

            strictEqual(transpiled, statement);
          },
        );
      },
    );
  },
);

void test(
  "prioritized index resolution",
  (t) =>
  {
    const source = `import("./fixtures/baz");`;
    const expected = `import("./fixtures/baz/index.mjs");`;

    const result = transpileCode(
      source,
      ".mjs",
      null,
      {
        resolveIndex: {
          extensions: [
            ".mjs",
          ],
          prioritize: true,
        },
      },
    );

    strictEqual(result, expected);
  },
);

void test(
  "prioritized index resolution (non-existent)",
  (t) =>
  {
    const source = `import("./fixtures/bar");`;
    const expected = `import("./fixtures/bar.cjs");`;

    const result = transpileCode(
      source,
      ".cjs",
      null,
      {
        resolveIndex: {
          extensions: [
            ".cjs",
          ],
          prioritize: true,
        },
      },
    );

    strictEqual(result, expected);
  },
);

void test(
  "non-prioritized index resolution",
  (t) =>
  {
    const source = `import("./fixtures/baz");`;
    const expected = `import("./fixtures/baz.mjs");`;

    const result = transpileCode(
      source,
      ".mjs",
      null,
      {
        resolveIndex: {
          extensions: [
            ".mjs",
          ],
          prioritize: false,
        },
      },
    );

    strictEqual(result, expected);
  },
);

void test(
  "non-prioritized index resolution (non-existent)",
  (t) =>
  {
    const source = `import("./fixtures/bar");`;
    const expected = `import("./fixtures/bar.cjs");`;

    const result = transpileCode(
      source,
      ".cjs",
      null,
      {
        resolveIndex: {
          extensions: [
            ".cjs",
          ],
          prioritize: false,
        },
      },
    );

    strictEqual(result, expected);
  },
);
