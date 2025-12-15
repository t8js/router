import type { Config } from "./Config.ts";
import type { LocationValue } from "./LocationValue.ts";

export type LocationPattern = Config["strict"] extends true
  ? LocationValue | LocationValue[]
  : LocationValue | RegExp | (LocationValue | RegExp)[];
