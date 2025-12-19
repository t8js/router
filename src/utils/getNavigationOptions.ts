import type { LinkElement } from "../types/LinkElement.ts";
import type { NavigationOptions } from "../types/NavigationOptions.ts";

export function getNavigationOptions({ href, target, dataset }: LinkElement) {
  return {
    href,
    target,
    spa: dataset.spa,
    history: dataset.history,
    scroll: dataset.scroll,
    id: dataset.id,
  } as NavigationOptions;
}
