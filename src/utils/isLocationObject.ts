import type { LocationObject } from "../types/LocationObject";

export function isLocationObject(x: unknown): x is LocationObject {
  return (
    x !== null &&
    typeof x === "object" &&
    "exec" in x &&
    "compile" in x &&
    "_schema" in x
  );
}
