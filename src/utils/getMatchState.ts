import type { LocationPattern } from "../types/LocationPattern";
import type { MatchState } from "../types/MatchState";
import { getQuery } from "./getQuery";
import { isLocationObject } from "./isLocationObject";
import { match } from "./match";

export function getMatchState<P extends LocationPattern>(
  locationPattern: P,
  href: string,
) {
  let matchResult = match<P>(locationPattern, href);

  return {
    ok: matchResult !== null,
    href,
    params: matchResult?.params ?? {},
    query:
      matchResult?.query ??
      (isLocationObject(locationPattern) ? null : getQuery(href)) ??
      {},
  } as MatchState<P>;
}
