import { NavigationOptions } from "./NavigationOptions.ts";

export type NavigationCallback = (options: NavigationOptions) =>
  boolean | undefined | Promise<boolean | undefined> | void | Promise<void>;
