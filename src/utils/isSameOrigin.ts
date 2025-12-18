import { QuasiURL } from "quasiurl";

export function isSameOrigin(url: string | undefined): boolean {
  if (url === undefined) return false;

  let urlObject = new QuasiURL(url);

  return (
    urlObject.origin === "" ||
    (typeof window !== "undefined" &&
      urlObject.origin === window.location.origin)
  );
}
