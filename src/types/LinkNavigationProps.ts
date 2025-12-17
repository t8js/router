import type { NavigationMode } from "./NavigationMode.ts";
import type { ScrollMode } from "./ScrollMode.ts";

export type LinkNavigationProps = {
  "data-navigation-mode"?: NavigationMode | undefined;
  "data-scroll"?: ScrollMode | undefined;
};
