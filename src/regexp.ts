export interface JSONRegexp
{
  flags?: null | string;
  regexp: string;
}

export function ensureIfRegExp<T>(
  value: T,
): (
  & (
    T extends JSONRegexp
      ? RegExp
      : T
  )
  & (
    T extends RegExp
      ? RegExp
      : T
  )
);
export function ensureIfRegExp<T>(
  value: JSONRegexp | RegExp | T,
): RegExp | T
{
  if (value instanceof RegExp)
  {
    return value;
  }

  if (typeof value === "object" && value !== null && "regexp" in value)
  {
    return new RegExp(
      value.regexp,
      value.flags ?? "",
    );
  }

  return value;
}
