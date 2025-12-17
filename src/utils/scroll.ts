import { QuasiURL } from "quasiurl";
import type { LinkProps } from "../types/LinkProps.ts";

export function scroll({
  href,
  target,
}: LinkProps | HTMLAnchorElement | HTMLAreaElement) {
  if (typeof window === "undefined" || (target && target !== "_self")) return;

  let { hash } = new QuasiURL(String(href));
  let targetElement = hash === "" ? null : document.querySelector(hash);

  if (targetElement) targetElement.scrollIntoView();
  else window.scrollTo(0, 0);
}
