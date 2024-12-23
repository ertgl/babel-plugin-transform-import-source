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
