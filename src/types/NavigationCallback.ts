import type { NavigationMode } from "./NavigationMode";

type Callback<R> = (
  nextHref: string,
  prevHref: string,
  navigationMode?: NavigationMode,
) => R | Promise<R>;

export type NavigationCallback = Callback<boolean | undefined> | Callback<void>;
