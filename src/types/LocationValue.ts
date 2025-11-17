import type { Config } from "./Config.ts";
import type { LocationObject } from "./LocationObject.ts";

export type LocationValue<C extends Config = Config> = C["strict"] extends true
  ? LocationObject | undefined
  : string | LocationObject | undefined;
