import {
  type BabelAPI,
  declare,
} from "@babel/helper-plugin-utils";

import {
  type ModuleMethodsOptions,
  resolveModuleMethods,
} from "./module-methods";
import {
  createDefaultTransformer,
  type Transformer,
  type TransformerOptions,
} from "./transformer";
import { createVisitor } from "./visitor";

export interface Options
{
  moduleMethods?: ModuleMethodsOptions | null;
  transform?: null | TransformerOptions;
  transformer?: null | Transformer;
}

export const plugin = declare<Options>(
  (
    api: BabelAPI,
    options: null | Options | undefined,
    dirname: string,
  ) =>
  {
    if (options == null)
    {
      return {
        visitor: {},
      };
    }

    if (options.transform == null)
    {
      return {
        visitor: {},
      };
    }

    return {
      visitor: createVisitor(
        api,
        options.transformer ?? createDefaultTransformer(),
        options.transform,
        resolveModuleMethods(options.moduleMethods),
      ),
    };
  },
);
