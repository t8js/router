import { QuasiURL } from "quasiurl";
import type { LocationValue } from "../types/LocationValue.ts";

export function isSameOrigin(url: LocationValue | URL | QuasiURL): boolean {
  if (url === undefined) return false;

  let urlObject = new QuasiURL(String(url));

  return (
    urlObject.origin === "" ||
    (typeof window !== "undefined" &&
      urlObject.origin === window.location.origin)
  );
}
