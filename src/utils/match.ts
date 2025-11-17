import type { StandardSchemaV1 } from "@standard-schema/spec";
import { QuasiURL } from "quasiurl";
import type { LocationPattern } from "../types/LocationPattern.ts";
import type { MatchState } from "../types/MatchState.ts";
import type { URLComponents } from "../types/URLComponents.ts";
import type { URLSchema } from "../types/URLSchema.ts";
import { isLocationObject } from "./isLocationObject.ts";

function toObject(x: string[]) {
  return x.reduce<Record<string, string>>((p, v, k) => {
    p[String(k)] = v;

    return p;
  }, {});
}

function matchPattern<P extends LocationPattern>(pattern: P, href: string) {
  let query = Object.fromEntries(
    new URLSearchParams(new QuasiURL(href).search),
  );

  if (typeof pattern === "string")
    return {
      ok: pattern === "*" || pattern === href,
      href,
      params: {},
      query,
    };

  if (pattern instanceof RegExp) {
    let matches = pattern.exec(href);

    return {
      ok: matches !== null,
      href,
      params: matches
        ? {
            ...toObject(Array.from(matches).slice(1)),
            ...matches.groups,
          }
        : {},
      query,
    };
  }

  if (isLocationObject(pattern)) {
    let result = pattern.exec(href) as
      | (P extends {
          _schema: URLSchema;
        }
          ? StandardSchemaV1.InferOutput<P["_schema"]>
          : URLComponents)
      | null;

    if (result === null)
      return {
        ok: false,
        href,
        params: {},
        query: {},
      };

    return {
      ok: true,
      href,
      params: result.params ?? {},
      query: result.query ?? {},
    };
  }

  return {
    ok: false,
    href,
    params: {},
    query: {},
  };
}

export function match<P extends LocationPattern>(
  pattern: P,
  href: string,
): MatchState<P> {
  if (Array.isArray(pattern)) {
    for (let p of pattern) {
      let result = matchPattern(p, href);

      if (result.ok) return result as MatchState<P>;
    }

    return {
      ok: false,
      href,
      params: {},
      query: {},
    } as MatchState<P>;
  }

  return matchPattern(pattern, href) as MatchState<P>;
}
