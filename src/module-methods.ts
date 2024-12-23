export interface ImportMetaImportSourceTransformerOptions
{
  propertyName?: null | string;
};

export interface ImportMetaImportSourceTransformerResolvedOptions
{
  propertyName: string;
};

export interface ImportSourceTransformerModuleMethodsOptions
{
  importMeta?: boolean | ImportMetaImportSourceTransformerOptions | null;
  require?: boolean | null | RequireImportSourceTransformerOptions;
};

export interface ImportSourceTransformerModuleMethodsResolvedOptions
{
  importMeta: ImportMetaImportSourceTransformerResolvedOptions;
  require: RequireImportSourceTransformerResolvedOptions;
};

export interface ModuleMethods
{
  transformImportSource: ImportSourceTransformerModuleMethodsResolvedOptions;
};

export interface ModuleMethodsOptions
{
  transformImportSource?: ImportSourceTransformerModuleMethodsOptions | null;
};

export interface RequireImportSourceTransformerOptions
{
  propertyName?: null | string;
};

export interface RequireImportSourceTransformerResolvedOptions
{
  propertyName: string;
};

export function resolveImportSourceTransformerModuleMethodsOptions(
  options?: ImportSourceTransformerModuleMethodsOptions | null,
): ImportSourceTransformerModuleMethodsResolvedOptions
{
  return {
    importMeta: resolveImportMetaImportSourceTransformerOptions(
      options?.importMeta,
    ),
    require: resolveRequireImportSourceTransformerOptions(
      options?.require,
    ),
  };
}

export function resolveModuleMethods(
  options?: ModuleMethodsOptions | null,
): ModuleMethods
{
  return {
    transformImportSource: resolveImportSourceTransformerModuleMethodsOptions(
      options?.transformImportSource,
    ),
  };
}

export const DEFAULT_IMPORT_META_IMPORT_SOURCE_TRANSFORMER_PROPERTY_NAME = "transform";

export function resolveImportMetaImportSourceTransformerOptions(
  options?: boolean | ImportMetaImportSourceTransformerOptions | null,
): ImportMetaImportSourceTransformerResolvedOptions
{
  if (options == null || options === false)
  {
    return {
      propertyName: "",
    };
  }

  if (options === true)
  {
    return {
      propertyName: DEFAULT_IMPORT_META_IMPORT_SOURCE_TRANSFORMER_PROPERTY_NAME,
    };
  }

  if (options.propertyName == null)
  {
    return {
      propertyName: "",
    };
  }

  return {
    propertyName: options.propertyName,
  };
}

export const DEFAULT_REQUIRE_IMPORT_SOURCE_TRANSFORMER_PROPERTY_NAME = "transform";

export function resolveRequireImportSourceTransformerOptions(
  options?: boolean | null | RequireImportSourceTransformerOptions,
): RequireImportSourceTransformerResolvedOptions
{
  if (options == null || options === false)
  {
    return {
      propertyName: "",
    };
  }

  if (options === true)
  {
    return {
      propertyName: DEFAULT_REQUIRE_IMPORT_SOURCE_TRANSFORMER_PROPERTY_NAME,
    };
  }

  if (options.propertyName == null)
  {
    return {
      propertyName: "",
    };
  }

  return {
    propertyName: options.propertyName,
  };
}
