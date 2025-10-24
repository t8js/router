export function toStringMap(
  x: Record<string, unknown> | undefined,
): Record<string, string> {
  if (!x) return {};

  let xs: Record<string, string> = {};

  for (let [k, v] of Object.entries(x)) {
    if (v === null || v === undefined) continue;

    xs[k] = typeof v === "string" ? v : JSON.stringify(v);
  }

  return xs;
}
