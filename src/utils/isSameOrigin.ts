import { QuasiURL } from "quasiurl";
import type { LocationValue } from "../types/LocationValue.ts";

export function isSameOrigin(location: LocationValue): boolean {
  if (location === undefined) return false;

  let url = new QuasiURL(String(location));

  return (
    url.origin === "" ||
    (typeof window !== "undefined" && url.origin === window.location.origin)
  );
}
