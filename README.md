# babel-plugin-transform-import-source

[Babel](https://babeljs.io/) plugin for transforming import sources.

## Overview

This plugin allows transforming import sources in the `require`, `import`, and
`export` statements either based on a set of custom rules or by applying a
custom function. It can be useful for modifying import sources to match the
output file extensions, or manipulating query parameters based on certain
conditions at compile-time, etc.

## Features

- Transform import sources in `require/import` expressions and `import/export`
  statements
- Transform import sources outside of the statements with compile-time macros
- Resolve index file when the import source refers to a directory
- Exclude certain import sources to be transformed, with magic comments
- Handle multiple rules to match and replace import sources with different
  patterns
- Force absolute paths to bypass test conditions (easy cross-platform support)
- Take advantage of the low-level API to implement completely custom behavior

## Installation

Install the plugin using npm or another package manager:

```sh
npm install -D babel-plugin-transform-import-source
```

## Usage

Add the plugin to the Babel configuration and specify the transformation rules
in the options object.

```js
module.exports = {
  plugins: [
    [
      require.resolve("babel-plugin-transform-import-source"),
      {
        transform: {
          rules: [
            {
              // Apply this rule to explicit relative paths only.
              test: /^[.\\/]+.*$/,
              // Bypass the test condition to match absolute paths without
              // any restrictions.
              includeAbsolute: true,
              // Find either the extension part or the end of the string.
              //
              // `$` character matches the end of the string.
              // `?` character makes the pattern optional.
              //
              // As a result, this will cause the transformation to
              // either replace the extension part with `.mjs` or, append
              // `.mjs` to the end of the string if there is no extension.
              //
              // For example, the import source `./file.ts` will be
              // transformed to `./file.mjs`, and the import source
              // `./file` will be transformed to `./file.mjs` as well.
              find: /(?:\.[cm]?[jt]s[x]?)?$/iu,
              replace: ".mjs",
              // If the import source refers to a directory,
              // first append `index` suffix to the import source,
              // then apply the transformation.
              //
              // This will cause the transformation to replace an import
              // source like `./dir` with `./dir/index.mjs`, assuming
              // `./dir` refers to a directory in this example.
              resolveIndex: true,
            },
          ],
        },
      },
    ],
  ],
};
```

### JSON Configuration

In case of using JSON configuration, the RegExp patterns can be provided as
objects containing the `regexp` and optional `flags` properties.

```json
{
  "plugins": [
    [
      "babel-plugin-transform-import-source",
      {
        "transform": {
          "rules": [
            {
              "test": {
                "regexp": "^[.\\\\/]+.*$"
              },
              "includeAbsolute": true,
              "find": {
                "regexp": "(?:\\.[cm]?[jt]s[x]?)?$",
                "flags": "iu"
              },
              "replace": ".mjs",
              "resolveIndex": true
            }
          ]
        }
      }
    ]
  ]
}
```

### Low-Level API

The plugin can also be used with a custom function to transform import sources.

```js
const { createDefaultTransformer } = require("babel-plugin-transform-import-source");

/**
 * @import { type TransformerContext } from "babel-plugin-transform-import-source";
 */

// The default transformer function can be re-used in a custom one.
const superTransform = createDefaultTransformer();

module.exports = {
  plugins: [
    [
      require.resolve("babel-plugin-transform-import-source"),
      {
        transformer: (
          /**
           * @type {TransformerContext}
           */
          context
        ) =>
        {
          // For example, Babel API or the default transformer function
          // can be used depending on certain conditions.
          if (condition)
          {
            context.nodePath.replaceWith(context.api.types.nullLiteral());
            return undefined;
          }
          else if (otherCondition)
          {
            return `${context.importSource}?enterprise=true&oss=false`;
          }
          return superTransform(context);
        },
      },
    ],
  ],
};
```

#### Technical Details

The plugin handles the following types of AST nodes:

- `CallExpression`
- `ExportAllDeclaration`
- `ExportNamedDeclaration`
- `ImportDeclaration`
- `ImportExpression`

The transformer function is called for each import source in the AST nodes
mentioned above. The function receives a context object containing the
information about the current import source and the AST node. See the
transformer context definition below for more information.

#### Transformer Context

The transformer context object contains the following properties:

- **dirname**: The directory path of the current file.
- **filename**: The file path of the current file.
- **importSource**: The import source.
- **importSourceNode**: AST node of the import source.
- **nodePath**: Current AST node path.
- **options**: Plugin options.
- **state**: Plugin state.

### Module Methods

The plugin also provides compile-time `.transform` module-methods to transform
import sources outside of the statements.

When the feature is enabled, the `.transform` macros can be accessed via the
`import.meta` object or the `require` function.

```js
// Transforms `./file.ts` and returns the result.
import.meta.transform("./file.ts");

// Same as above.
require.transform("./file.ts");
```

#### Type Definitions for Module Methods

The type definitions for the module methods with the default property names are
provided in the `env.d.ts` file. They can be imported with a `reference`
directive.

For custom property names, TypeScript's interface merging feature can be used
to extend the default type definitions.

```ts
declare module "module"
{
  declare global
  {
    interface ImportMeta
    {
      transform(source: string): string;
    }
  }
}

declare namespace NodeJS
{
  interface Require
  {
    transform(source: string): string;
  }
}
```

### Magic Comments

To exclude certain import sources from being transformed,
`@babel-plugin-transform-import-source-ignore` directive can be used in
a leading comment line.

```js
// The import source will remain unchanged.
// @babel-plugin-transform-import-source-ignore
import "./file.ts";

// Same as above.
require(
  // @babel-plugin-transform-import-source-ignore
  "./file.ts",
);

// The import source here will remain unchanged as well.
// And the expression will return `./file.ts` as it is.
import.meta.transform(
  // @babel-plugin-transform-import-source-ignore
  "./file.ts",
);
```

## Options

The plugin accepts an options object with the following properties.

### `moduleMethods`

- **Type:** `object`
- **Description:** Configuration for the module methods.
- **Properties:**
  - `transformImportSource`: (Optional) Configuration for the compile-time
  `.transform` methods.
    - **Type:** `object`
    - **Properties:**
      - `importMeta`: (Optional) A boolean to enable/disable the
        `import.meta.transform` macro. Or an `object` with `propertyName`
        property to specify the custom property name. Default is `false`.
      - `require`: (Optional) A boolean to enable/disable the `require.transform`
        macro. Or an `object` with `propertyName` property to specify the custom
        property name. Default is `false`.

### `transform`

- **Type:** `object`
- **Description:** Configuration for transforming import sources.
- **Properties:**
  - `rules`: An array of transformation rules.

#### Rule

A transformation rule object can have the following properties:

- **find**: A string or RegExp to match the import source to replace.
- **replace**: A string to replace the matched import source.
- **includeAbsolute**: (Optional) A boolean to include absolute paths by
  bypassing the test.
- **resolveIndex**: (Optional) A boolean to resolve index file when the import
  source refers to a directory.
- **test**: (Optional) A string or RegExp to test the import source.

### `transformer`

- **Type:** `function`
- **Description:** A custom function to transform import sources.
- **Arguments:**
  - `context`: The transformer context object.
- **Returns:** The transformed import source. If the function returns
  `null` or `undefined`, the import source remains unchanged.

## Development Notes

The plugin is written in TypeScript and compiled to both CommonJS and
ECMAScript modules, and the import sources are transformed to match the output
file extensions accordingly. The following notes are not specific to the plugin
only, but they can be helpful for understanding the motivation behind the
plugin.

Targeting both CommonJS and ECMAScript modules in a single package is a common
use case to provide compatibility with different environments and tools.
Achieving this usually requires workarounds to ensure that the module types are
resolved correctly in different environments. These workarounds are like
defining `type` fields in `package.json` files
(e.g., `"type": "commonjs"` or `"type": "module"`), or writing wrapper scripts
around the main entry points. Since using wrapper scripts can be helpful in
avoiding
[dual-package hazards](https://github.com/nodejs/package-examples#dual-package-hazard),
they can also reduce the static evaluation of the package and make it less
optimizable (assuming that the module type is CommonJS at the beginning).

By using `.cjs` or `.mjs` file extensions, the module type becomes explicit and
independent of the environment. This allows the module type to be recognized as
a CommonJS or ECMAScript module without relying on the environment or
configuration files like `package.json`. Instead, it can be determined by the
file extension itself. This can be beneficial in many ways, such as making the
package more portable and less error-prone in different environments.

While CommonJS allows import paths to be written without file extensions,
ECMAScript spec requires import paths to be fully specified with explicit file
extensions. This mismatch can cause issues in certain scenarios, such as when
a package is written in TypeScript with extensionless imports, and then it's
compiled and consumed by ECMAScript modules, etc.

To make the module types explicit while compiling with Babel, the
`--out-file-extension` flag can be used to set the output file extensions
(e.g., `--out-file-extension '.cjs'` or `--out-file-extension '.mjs'`).
However, -according to my tests- Babel does not use this flag for import
sources in statements to be transformed respectively. So, the import sources
remain unchanged, while extensions of the output files are modified. This can
cause the exact issue mentioned above as well.

The plugin can be used to fill this gap for transforming the import sources in
the statements to make them match the output file extensions. This way, the
module types are resolved correctly in both CommonJS and ECMAScript modules,
and the package becomes more consistent and reliable.

### Build Process

The plugin uses itself to transform its own import source strings to target the
desired module type explicitly.

To make the plugin able to use itself in its own build process, there is a
[bootstrap phase](https://en.wikipedia.org/wiki/Bootstrapping_(compilers))
that compiles the plugin to CommonJS modules first. Since the format of the
import paths is extensionless in the source code, and this is acceptable in
CommonJS modules, they don't need to be changed in the output files. But, at
this step, the output file names have `.js` extension. Although the default
module type in Node.js is CommonJS, the `type` field in the `package.json` file
is set to `"type": "commonjs"` to ensure that the files are recognized as
CommonJS modules in any case. Finally, these compiled files can be imported
into the Babel configurations successfully.

After the bootstrap phase, the actual build process gets started. At this
point, the early version of the plugin that obtained from the bootstrap phase
is used as a part of the build process to transform the import sources in the
statements to match the output file extensions.

The process can be observed in the following steps:

1. The `bootstrap::cjs` script defined in the [`package.json`](package.json)
file gets executed to compile the plugin to CommonJS modules using the
[`babel.config.bootstrap.cjs`](babel.config.bootstrap.cjs) configuration file.
2. [`babel.config.cjs.cjs`](babel.config.cjs.cjs) and
[`babel.config.esm.cjs`](babel.config.esm.cjs) configuration files require the
CommonJS modules compiled in the bootstrap phase. This is where the plugin uses
itself to compile its own source code to target the desired module types
explicitly.
3. The `build::cjs` and `build::esm` scripts defined in the
[`package.json`](package.json) file get executed to compile the plugin to both
CommonJS and ECMAScript modules using the corresponding configuration files
mentioned in the previous step.

## License

This project is licensed under the
[MIT License](https://opensource.org/license/mit).

See the [LICENSE](LICENSE) file for more information.
