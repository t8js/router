import type { LinkNavigationProps } from "../types/LinkNavigationProps.ts";
import type { ScrollMode } from "../types/ScrollMode.ts";

export function getScrollMode(
  x: HTMLElement | LinkNavigationProps,
): ScrollMode | undefined {
  if ("dataset" in x) return x.dataset.scroll as ScrollMode | undefined;

  return x["data-scroll"];
}
