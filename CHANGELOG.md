# babel-plugin-transform-import-source

## 2.0.0

### Major Changes

- Add `indexFallback` option to provide a value when no index file with the
  extensions specified via `indexFileExtensions` is found during resolution.
  To use the old behavior, set `indexFallback` to `"index"`.
