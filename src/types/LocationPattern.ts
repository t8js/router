import type { Config } from "./Config";
import type { LocationValue } from "./LocationValue";

export type LocationPattern<C extends Config = Config> =
  C["strict"] extends true
    ? LocationValue | LocationValue[]
    : LocationValue | RegExp | (LocationValue | RegExp)[];
