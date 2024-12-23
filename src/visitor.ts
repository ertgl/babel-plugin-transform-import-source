import type {
  NodePath,
  PluginPass,
  Visitor,
} from "@babel/core";
import type { BabelAPI } from "@babel/helper-plugin-utils";

import {
  type CallExpression,
  type ExportAllDeclaration,
  type ExportNamedDeclaration,
  type ImportDeclaration,
  type ImportExpression,
} from "@babel/types";

import type { ModuleMethods } from "./module-methods";

import {
  createTransformerDelegator,
  type Transformer,
  type TransformerDelegator,
  type TransformerOptions,
} from "./transformer";

export function createCallVisitHandler(
  api: BabelAPI,
  maybeTransformImportSource: TransformerDelegator,
  moduleMethods: ModuleMethods,
)
{
  return (
    path: NodePath<CallExpression>,
    state: PluginPass,
  ) =>
  {
    if (
      (
        (
          path.node.callee.type === "Identifier"
          && path.node.callee.name === "require"
        )
        || path.node.callee.type === "Import"
      )
      && path.node.arguments.length === 1
      && path.node.arguments[0].type === "StringLiteral"
    )
    {
      maybeTransformImportSource(
        api,
        path,
        state,
        path.node.arguments[0],
        path.node.arguments[0].value,
        (
          finalImportSource,
          isTransformed,
        ) =>
        {
          if (isTransformed)
          {
            path.node.arguments[0] = api.types.stringLiteral(finalImportSource);
          }
        },
      );
    }

    if (
      moduleMethods.transformImportSource.importMeta.propertyName.length === 0
      && moduleMethods.transformImportSource.require.propertyName.length === 0
    )
    {
      return;
    }

    if (path.node.callee.type !== "MemberExpression")
    {
      return;
    }

    if (
      !(
        path.node.arguments.length === 1
        && path.node.arguments[0].type === "StringLiteral"
      )
    )
    {
      return;
    }

    if (
      path.node.callee.object.type === "Identifier"
      && path.node.callee.object.name === "require"
      && path.node.callee.property.type === "Identifier"
      && path.node.callee.property.name === moduleMethods.transformImportSource.require.propertyName
    )
    {
      maybeTransformImportSource(
        api,
        path,
        state,
        path.node.arguments[0],
        path.node.arguments[0].value,
        (
          finalImportSource,
          isTransformed,
        ) =>
        {
          path.replaceWith(api.types.stringLiteral(finalImportSource));
        },
      );
    }
    else if (
      path.node.callee.object.type === "MetaProperty"
      && path.node.callee.object.meta.name === "import"
      && path.node.callee.object.property.name === "meta"
      && path.node.callee.property.type === "Identifier"
      && path.node.callee.property.name === moduleMethods.transformImportSource.importMeta.propertyName
    )
    {
      maybeTransformImportSource(
        api,
        path,
        state,
        path.node.arguments[0],
        path.node.arguments[0].value,
        (
          finalImportSource,
          isTransformed,
        ) =>
        {
          path.replaceWith(api.types.stringLiteral(finalImportSource));
        },
      );
    }
  };
}

export function createDynamicImportVisitHandler(
  api: BabelAPI,
  maybeTransformImportSource: TransformerDelegator,
)
{
  return (
    path: NodePath<ImportExpression>,
    state: PluginPass,
  ) =>
  {
    if (api.types.isStringLiteral(path.node.source))
    {
      maybeTransformImportSource(
        api,
        path,
        state,
        path.node.source,
        path.node.source.value,
        (
          finalImportSource,
          isTransformed,
        ) =>
        {
          if (isTransformed)
          {
            path.node.source = api.types.stringLiteral(
              finalImportSource,
            );
          }
        },
      );
    }
  };
}

export function createStaticImportExportVisitHandler(
  api: BabelAPI,
  maybeTransformImportSource: TransformerDelegator,
)
{
  return (
    path: (
      | NodePath<ExportAllDeclaration>
      | NodePath<ExportNamedDeclaration>
      | NodePath<ImportDeclaration>
    ),
    state: PluginPass,
  ) =>
  {
    if (path.node.source != null)
    {
      maybeTransformImportSource(
        api,
        path,
        state,
        path.node.source,
        path.node.source.value,
        (
          finalImportSource,
          isTransformed,
        ) =>
        {
          if (isTransformed)
          {
            path.node.source = api.types.stringLiteral(
              finalImportSource,
            );
          }
        },
      );
    }
  };
}

export function createVisitor(
  api: BabelAPI,
  transformer: Transformer,
  options: TransformerOptions,
  moduleMethods: ModuleMethods,
): Visitor<PluginPass>
{
  const maybeTransformImportSource = createTransformerDelegator(
    transformer,
    options,
  );

  const handleStaticImportExport = createStaticImportExportVisitHandler(
    api,
    maybeTransformImportSource,
  );

  const handleDynamicImport = createDynamicImportVisitHandler(
    api,
    maybeTransformImportSource,
  );

  const handleCall = createCallVisitHandler(
    api,
    maybeTransformImportSource,
    moduleMethods,
  );

  const visitor: Visitor<PluginPass> = {
    CallExpression(
      path,
      state,
    )
    {
      handleCall(path, state);
    },

    ExportAllDeclaration(
      path,
      state,
    )
    {
      handleStaticImportExport(path, state);
    },

    ExportNamedDeclaration(
      path,
      state,
    )
    {
      handleStaticImportExport(path, state);
    },

    ImportDeclaration(
      path,
      state,
    )
    {
      handleStaticImportExport(path, state);
    },

    ImportExpression(
      path,
      state,
    )
    {
      handleDynamicImport(path, state);
    },
  };

  return visitor;
}
