import { LinkProps } from "../types/LinkProps.ts";
import { isSameOrigin } from "./isSameOrigin.ts";

export function isRouteEvent(
  event: unknown,
  { href, target }: LinkProps | HTMLAnchorElement | HTMLAreaElement,
): boolean {
  return (
    event !== null &&
    typeof event === "object" &&
    (!("button" in event) || event.button === 0) &&
    (!("ctrlKey" in event) || !event.ctrlKey) &&
    (!("shiftKey" in event) || !event.shiftKey) &&
    (!("altKey" in event) || !event.altKey) &&
    (!("metaKey" in event) || !event.metaKey) &&
    (!target || target === "_self") &&
    (!href || isSameOrigin(href))
  );
}
