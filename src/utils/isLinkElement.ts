import type { LinkElement } from "../types/LinkElement.ts";

export function isLinkElement(x: unknown): x is LinkElement {
  return x instanceof HTMLAnchorElement || x instanceof HTMLAreaElement;
}
