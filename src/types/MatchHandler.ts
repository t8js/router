import type { LocationPattern } from "./LocationPattern.ts";
import type { MatchState } from "./MatchState.ts";

export type MatchHandler<P extends LocationPattern, T> = (
  payload: MatchState<P>,
) => T;
