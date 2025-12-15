import type { Route } from "./Route.ts";
import type { ContainerElement } from "./types/ContainerElement.ts";
import { getNavigationMode } from "./utils/getNavigationMode.ts";
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

    if (!route.connected || !resolvedContainer) return;

    if (event.defaultPrevented) return;

    let activeElement: HTMLAnchorElement | HTMLAreaElement | null = null;
    let connectedElements = isArrayLike(elements)
      ? Array.from(elements)
      : [elements];

    for (let connectedElement of connectedElements) {
      let element: Node | null = null;

      if (typeof connectedElement === "string")
        element =
          event.target instanceof HTMLElement
            ? event.target.closest(connectedElement)
            : null;
      else element = connectedElement;

      if (
        isLinkElement(element) &&
        resolvedContainer.contains(element) &&
        isRouteEvent(event, element)
      ) {
        activeElement = element;
        break;
      }
    }

    if (!activeElement) return;

    event.preventDefault();
    route._navigate(activeElement.href, getNavigationMode(activeElement));
  };

  document.addEventListener("click", handleClick);

  return () => {
    document.removeEventListener("click", handleClick);
  };
}
