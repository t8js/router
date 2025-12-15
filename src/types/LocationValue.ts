import type { Config } from "./Config.ts";
import type { LocationObject } from "./LocationObject.ts";

export type LocationValue = Config["strict"] extends true
  ? LocationObject | undefined
  : string | LocationObject | undefined;
