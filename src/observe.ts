import type { Route } from "./Route.ts";
import type { ContainerElement } from "./types/ContainerElement.ts";
import { getNavigationOptions } from "./utils/getNavigationOptions.ts";
import { isArrayLike } from "./utils/isArrayLike.ts";
import { isLinkElement } from "./utils/isLinkElement.ts";
import { isRouteEvent } from "./utils/isRouteEvent.ts";

/**
 * @see `Route.observe()`
 */
export function observe(
  route: Route,
  container: ContainerElement | (() => ContainerElement),
  elements:
    | string
    | Node
    | (string | Node)[]
    | HTMLCollection
    | NodeList = "a, area",
) {
  let handleClick = (event: MouseEvent) => {
    let resolvedContainer =
      typeof container === "function" ? container() : container;

    if (!isRouteEvent(event) || !route.active || !resolvedContainer) return;

    if (event.defaultPrevented) return;

    let element: HTMLAnchorElement | HTMLAreaElement | null = null;
    let targetElements = isArrayLike(elements)
      ? Array.from(elements)
      : [elements];

    for (let targetElement of targetElements) {
      let target: Node | null = null;

      if (typeof targetElement === "string")
        target =
          event.target instanceof HTMLElement
            ? event.target.closest(targetElement)
            : null;
      else target = targetElement;

      if (isLinkElement(target) && resolvedContainer.contains(target)) {
        element = target;
        break;
      }
    }

    if (element) {
      event.preventDefault();
      route._navigate(getNavigationOptions(element));
    }
  };

  document.addEventListener("click", handleClick);

  return () => {
    document.removeEventListener("click", handleClick);
  };
}
