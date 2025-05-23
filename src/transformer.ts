import { statSync } from "node:fs";
import {
  dirname,
  isAbsolute,
  resolve as resolvePath,
} from "node:path";

import type {
  Node,
  NodePath,
  PluginPass,
} from "@babel/core";
import type { BabelAPI } from "@babel/helper-plugin-utils";

import {
  type CallExpression,
  type ExportAllDeclaration,
  type ExportNamedDeclaration,
  type ImportDeclaration,
  type ImportExpression,
} from "@babel/types";

import {
  ensureIfRegExp,
  type JSONRegexp,
} from "./regexp";

export type IndexResolutionFallbackHandler = (
  transformerContext: TransformerContext,
  fallbackHandlerContext: IndexResolutionFallbackHandlerContext,
) => null | string | undefined;

export type IndexResolutionFallbackHandlerContext = {
  findQuery: RegExp | string;
  matchedRule: TransformationRule;
};

export type ManagedNodePath = (
  | NodePath<CallExpression>
  | NodePath<ExportAllDeclaration>
  | NodePath<ExportNamedDeclaration>
  | NodePath<ImportDeclaration>
  | NodePath<ImportExpression>
);

export interface TransformationRule
{
  find: JSONRegexp | RegExp | string;
  includeAbsolute?: boolean | null;
  replace: string;
  resolveIndex?: boolean | null | TransformationRuleIndexResolutionOptions;
  test?: JSONRegexp | null | RegExp | string;
}

export type TransformationRuleIndexResolutionOptions = {
  extensions?: null | string[];
  fallback?: IndexResolutionFallbackHandler | null | string;
  prioritize?: boolean | null;
};

export type TransformCallbackHandler = (
  finalImportSource: string,
  isTransformed: boolean,
) => void;

export type Transformer = (
  context: TransformerContext,
) => null | string | undefined;

export type TransformerContext = (
  & {
    readonly api: BabelAPI;
    readonly importSource: string;
    readonly importSourceNode: Node;
    readonly nodePath: ManagedNodePath;
    readonly options: TransformerOptions;
    readonly state: PluginPass;
  }
  & (
    | {
      readonly dirname: null;
      readonly filename: null;
    }
    | {
      readonly dirname: string;
      readonly filename: string;
    }
    | {
      readonly dirname: undefined;
      readonly filename: undefined;
    }
  )
);

export type TransformerDelegator = (
  api: BabelAPI,
  nodePath: (
    | NodePath<CallExpression>
    | NodePath<ExportAllDeclaration>
    | NodePath<ExportNamedDeclaration>
    | NodePath<ImportDeclaration>
    | NodePath<ImportExpression>
  ),
  state: PluginPass,
  importSourceNode: Node,
  importSource: string,
  callback: TransformCallbackHandler,
) => void;

export interface TransformerOptions
{
  rules?: null | TransformationRule[];
}

export function createDefaultTransformer(): Transformer
{
  return (
    context: TransformerContext,
  ): null | string | undefined =>
  {
    if (context.nodePath.node.leadingComments != null)
    {
      for (const comment of context.nodePath.node.leadingComments)
      {
        if (comment.type !== "CommentLine")
        {
          continue;
        }

        const commentText = comment.value.trim();

        if (
          commentText === "@babel-plugin-transform-import-source-ignore"
          || commentText.startsWith("@babel-plugin-transform-import-source-ignore ")
        )
        {
          return undefined;
        }
      }
    }

    if (context.importSourceNode.leadingComments != null)
    {
      for (const comment of context.importSourceNode.leadingComments)
      {
        if (comment.type !== "CommentLine")
        {
          continue;
        }

        const commentText = comment.value.trim();

        if (
          commentText === "@babel-plugin-transform-import-source-ignore"
          || commentText.startsWith("@babel-plugin-transform-import-source-ignore ")
        )
        {
          return undefined;
        }
      }
    }

    let matchedRule: null | TransformationRule = null;
    let findQuery: null | RegExp | string = null;

    let isImportPathAbsolute: boolean | null = null;

    for (const rule of context.options.rules ?? [])
    {
      isImportPathAbsolute ??= isAbsolute(context.importSource);

      if (!(rule.includeAbsolute && isImportPathAbsolute))
      {
        const testQuery = (
          rule.test == null
            ? null
            : ensureIfRegExp(rule.test)
        );

        if (testQuery != null)
        {
          const isImportPathIncluded = context.importSource.search(testQuery) !== -1;

          if (!isImportPathIncluded)
          {
            continue;
          }
        }
      }

      const tempFindQuery = ensureIfRegExp(rule.find);

      if (context.importSource.search(tempFindQuery) !== -1)
      {
        matchedRule = rule;
        findQuery = tempFindQuery;
        break;
      }
    }

    if (matchedRule == null || findQuery == null)
    {
      return undefined;
    }

    if (matchedRule.resolveIndex && context.dirname != null)
    {
      const indexResolutionOptions = (
        matchedRule.resolveIndex === true
          ? {}
          : matchedRule.resolveIndex
      );

      const absoluteImportPath = resolvePath(
        context.dirname,
        context.importSource,
      );

      const importPathStats = statSync(
        absoluteImportPath,
        {
          throwIfNoEntry: false,
        },
      );

      if (importPathStats?.isDirectory() ?? false)
      {
        if (indexResolutionOptions.extensions != null)
        {
          if (!indexResolutionOptions.prioritize)
          {
            for (const extension of indexResolutionOptions.extensions)
            {
              const absoluteNonIndexFilePath = `${absoluteImportPath}${extension}`;

              const nonIndexFileStats = statSync(
                absoluteNonIndexFilePath,
                {
                  throwIfNoEntry: false,
                },
              );

              if (nonIndexFileStats?.isFile() ?? false)
              {
                return `${context.importSource}${extension}`.replace(
                  findQuery,
                  matchedRule.replace,
                );
              }
            }
          }

          for (const extension of indexResolutionOptions.extensions)
          {
            const absoluteIndexFilePath = resolvePath(
              absoluteImportPath,
              `index${extension}`,
            );

            const indexFileStats = statSync(
              absoluteIndexFilePath,
              {
                throwIfNoEntry: false,
              },
            );

            if (indexFileStats?.isFile() ?? false)
            {
              return `${context.importSource}/index${extension}`.replace(
                findQuery,
                matchedRule.replace,
              );
            }
          }
        }

        if (indexResolutionOptions.fallback != null)
        {
          if (typeof indexResolutionOptions.fallback === "function")
          {
            const fallbackValue = indexResolutionOptions.fallback(
              context,
              {
                findQuery,
                matchedRule,
              },
            );

            if (fallbackValue != null)
            {
              return fallbackValue;
            }
          }
          else
          {
            return `${context.importSource}/${indexResolutionOptions.fallback}`.replace(
              findQuery,
              matchedRule.replace,
            );
          }
        }
      }
    }

    return context.importSource.replace(
      findQuery,
      matchedRule.replace,
    );
  };
};

export function createTransformerDelegator(
  transform: Transformer,
  options: TransformerOptions,
): TransformerDelegator
{
  return (
    api: BabelAPI,
    nodePath: ManagedNodePath,
    state: PluginPass,
    importSourceNode: Node,
    importSource: string,
    callback: TransformCallbackHandler,
  ): void =>
  {
    const context: TransformerContext = {
      api,
      dirname: (
        typeof state.file.opts.filename === "string"
          ? dirname(state.file.opts.filename)
          : (
              state.file.opts.filename === null
                ? null
                : undefined
            )
      ) as undefined,
      filename: state.file.opts.filename as undefined,
      importSource,
      importSourceNode,
      nodePath,
      options,
      state,
    };

    const transformedImportSource = transform(context);

    if (typeof transformedImportSource === "string")
    {
      callback(transformedImportSource, true);
    }
    else
    {
      callback(importSource, false);
    }
  };
}
