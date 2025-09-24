import type { LocationPattern } from "../types/LocationPattern";
import type { LocationShape } from "../types/LocationShape";
import type { MatchParams } from "../types/MatchParams";
import { isLocationObject } from "./isLocationObject";

function toObject(x: string[]) {
  return x.reduce<Record<string, unknown>>((p, v, k) => {
    p[String(k)] = v;

    return p;
  }, {});
}

export function match<P extends LocationPattern>(
  pattern: P,
  value: string,
): MatchParams<P> {
  let result: LocationShape = null;

  if (Array.isArray(pattern)) {
    for (let p of pattern) {
      let matches = match(p, value);

      if (matches) {
        result = matches;
        break;
      }
    }
  } else if (typeof pattern === "string")
    result = pattern === "*" || pattern === value ? {} : null;
  else if (pattern instanceof RegExp) {
    let matches = pattern.exec(value);

    result = matches
      ? {
          params: {
            ...toObject(Array.from(matches).slice(1)),
            ...matches.groups,
          },
        }
      : null;
  } else if (isLocationObject(pattern)) result = pattern.exec(value);

  return result as MatchParams<P>;
}
