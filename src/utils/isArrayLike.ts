export function isArrayLike(
  x: unknown,
): x is (string | Node)[] | HTMLCollection | NodeList {
  return (
    Array.isArray(x) || x instanceof NodeList || x instanceof HTMLCollection
  );
}
