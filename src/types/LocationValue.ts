import type { Config } from "./Config";
import type { LocationObject } from "./LocationObject";

export type LocationValue<C extends Config = Config> = C["strict"] extends true
  ? LocationObject | undefined
  : string | LocationObject | undefined;
