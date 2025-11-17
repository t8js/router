import type { Config } from "./Config.ts";
import type { LocationValue } from "./LocationValue.ts";

export type LocationPattern<C extends Config = Config> =
  C["strict"] extends true
    ? LocationValue | LocationValue[]
    : LocationValue | RegExp | (LocationValue | RegExp)[];
