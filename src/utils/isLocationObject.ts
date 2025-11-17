import type { LocationObject } from "../types/LocationObject.ts";

export function isLocationObject(x: unknown): x is LocationObject {
  return (
    x !== null &&
    typeof x === "object" &&
    "exec" in x &&
    "compile" in x &&
    "_schema" in x
  );
}
