# babel-plugin-transform-import-source

## 2.1.0

### Minor Changes

- Introduce `resolveIndex.prioritize` option to resolve conflicts between
  barrel and non-barrel files sharing the same import source.

## 2.0.1

### Patch Changes

- Fix a caching issue that could cause CI to publish stale code. Caching
  behavior is now deterministic to ensure correct code is always released.

## 2.0.0

### Major Changes

- Add `indexFallback` option to provide a value when no index file with the
  extensions specified via `indexFileExtensions` is found during resolution.
  To use the old behavior, set `indexFallback` to `"index"`.
