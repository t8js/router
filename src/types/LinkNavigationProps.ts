import type { NavigationOptions } from "./NavigationOptions.ts";

export type LinkNavigationProps = {
  "data-spa"?: NavigationOptions["spa"];
  "data-history"?: NavigationOptions["history"];
  "data-scroll"?: NavigationOptions["scroll"];
};
