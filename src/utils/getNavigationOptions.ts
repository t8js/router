import type { LinkElement } from "../types/LinkElement.ts";
import type { NavigationOptions } from "../types/NavigationOptions.ts";

export function getNavigationOptions(element: LinkElement) {
  let { id, spa, history, scroll } = element.dataset;

  return {
    href: element.getAttribute("href"),
    target: element.getAttribute("target"),
    spa,
    history,
    scroll,
    id,
  } as NavigationOptions;
}
