export function isRouteEvent(event: unknown) {
  return (
    event !== null &&
    typeof event === "object" &&
    (!("button" in event) || event.button === 0) &&
    (!("ctrlKey" in event) || !event.ctrlKey) &&
    (!("shiftKey" in event) || !event.shiftKey) &&
    (!("altKey" in event) || !event.altKey) &&
    (!("metaKey" in event) || !event.metaKey)
  );
}
