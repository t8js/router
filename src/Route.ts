import { QuasiURL } from "quasiurl";
import { observe } from "./observe.ts";
import type { LocationPattern } from "./types/LocationPattern.ts";
import type { LocationValue } from "./types/LocationValue.ts";
import type { MatchHandler } from "./types/MatchHandler.ts";
import type { NavigationCallback } from "./types/NavigationCallback.ts";
import type { NavigationEvent } from "./types/NavigationEvent.ts";
import type { NavigationMode } from "./types/NavigationMode.ts";
import type { URLData } from "./types/URLData.ts";
import { isLocationObject } from "./utils/isLocationObject.ts";
import { isSameOrigin } from "./utils/isSameOrigin.ts";
import { match } from "./utils/match.ts";
import { toStringMap } from "./utils/toStringMap.ts";

export class Route {
  _href = "";
  _cleanup: (() => void) | null = null;
  _handlers: Record<NavigationEvent, Set<NavigationCallback>> = {
    navigationstart: new Set(),
    navigationcomplete: new Set(),
  };
  _navigationQueue: [LocationValue | undefined, NavigationMode | undefined][] =
    [];
  _navigated = false;
  connected = false;
  navigating = false;

  constructor(location?: LocationValue) {
    this.connect(location);
  }

  connect(location?: LocationValue) {
    this.connected = true;
    this._href = this._getHref(location);
    this._init(location);

    return this;
  }

  disconnect() {
    this.connected = false;
    this._cleanup?.();
    this._navigated = false;
    this._navigationQueue = [];
  }

  observe(
    container: Parameters<typeof observe>[1],
    /**
     * A selector, or an HTML element, or a collection thereof.
     *
     * @defaultValue "a, area"
     */
    elements?: Parameters<typeof observe>[2],
  ) {
    return observe(this, container, elements);
  }

  on(event: NavigationEvent, callback: NavigationCallback) {
    if (!(event in this._handlers))
      throw new Error(`Unknown event type: '${event}'`);

    this._handlers[event].add(callback);

    if (this.connected && this._navigated) callback(this.href, this.href);

    return () => {
      this._handlers[event].delete(callback);
    };
  }

  _init(location?: LocationValue) {
    if (typeof window === "undefined") return;

    this._cleanup = this._subscribe();

    // Allow setting up event handlers before the first navigation.
    Promise.resolve()
      .then(() => this._navigate(location))
      .then(() => {
        this._navigated = true;
      });
  }

  _subscribe(): () => void {
    let navigationHandler = () => {
      this._navigate();
    };

    window.addEventListener("popstate", navigationHandler);

    return () => {
      window.removeEventListener("popstate", navigationHandler);
    };
  }

  _getHref(location?: LocationValue) {
    let url = new QuasiURL(
      String(
        location ?? (typeof window === "undefined" ? "" : window.location.href),
      ),
    );

    if (isSameOrigin(url.href)) url.origin = "";

    return url.href;
  }

  async _navigate<T extends LocationValue>(
    location?: T,
    navigationMode?: NavigationMode,
  ): Promise<void> {
    if (!this.connected) return;

    if (this.navigating) {
      this._navigationQueue.push([location, navigationMode]);
      return;
    }

    this.navigating = true;

    let prevHref = this._href;
    let nextHref = this._getHref(location);

    for (let callback of this._handlers.navigationstart) {
      let result = callback(nextHref, prevHref, navigationMode);

      if ((result instanceof Promise ? await result : result) === false)
        return this._end();
    }

    if (this._navigated || this._getHref() !== nextHref) {
      let result = this._transition(nextHref, prevHref, navigationMode);

      if ((result instanceof Promise ? await result : result) === false)
        return this._end();
    }

    this._href = nextHref;

    for (let callback of this._handlers.navigationcomplete) {
      let result = callback(nextHref, prevHref, navigationMode);

      if (result instanceof Promise) await result;
    }

    await this._end();
  }

  async _end() {
    this.navigating = false;

    let pendingNavigation = this._navigationQueue.shift();

    if (pendingNavigation !== undefined)
      await this._navigate.apply(this, pendingNavigation);
  }

  _transition(
    nextHref: string,
    _prevHref: string,
    navigationMode = "assign",
  ): ReturnType<NavigationCallback> {
    if (typeof window === "undefined") return;

    if (!window.history || !isSameOrigin(nextHref)) {
      window.location[navigationMode === "replace" ? "replace" : "assign"](
        nextHref,
      );
      return;
    }

    window.history[navigationMode === "replace" ? "replaceState" : "pushState"](
      {},
      "",
      nextHref,
    );
  }

  /**
   * Matches the current location against the location pattern.
   */
  match<P extends LocationPattern>(locationPattern: P) {
    return match<P>(locationPattern, this._href);
  }

  compile<T extends LocationValue>(location: T, data?: URLData<T>) {
    if (isLocationObject(location)) return location.compile(data);

    let url = new QuasiURL(location ?? "");
    let inputQuery = data?.query;

    if (inputQuery) url.search = new URLSearchParams(toStringMap(inputQuery));

    return url.href;
  }

  /**
   * Loosely resembles the conditional ternary operator
   * `matchesLocationPattern ? x : y`: if the current location matches
   * `locationPattern` the returned value is based on the second parameter,
   * otherwise on the third parameter.
   *
   * If the current location matches `locationPattern`,
   * `.at(locationPattern, x, y)` returns:
   * - `x`, if `x` is not a function;
   * - `x({ params })`, if `x` is a function, with `params` extracted from
   * the current location.
   *
   * If the current location doesn't match `locationPattern`,
   * `.at(locationPattern, x, y)` returns:
   * - `y`, if `y` is not a function;
   * - `y({ params })`, if `y` is a function, with `params` extracted from
   * the current location.
   */
  at<P extends LocationPattern, X>(
    locationPattern: P,
    matchOutput: X | MatchHandler<P, X>,
  ): X | undefined;

  at<P extends LocationPattern, X, Y>(
    locationPattern: P,
    matchOutput: X | MatchHandler<P, X>,
    mismatchOutput: Y | MatchHandler<P, Y>,
  ): X | Y;

  at<P extends LocationPattern, X, Y>(
    locationPattern: P,
    matchOutput: X | MatchHandler<P, X>,
    mismatchOutput?: Y | MatchHandler<P, Y>,
  ): X | Y | undefined {
    let matchState = match<P>(locationPattern, this._href);

    if (!matchState.ok)
      return typeof mismatchOutput === "function"
        ? (mismatchOutput as MatchHandler<P, Y>)(matchState)
        : mismatchOutput;

    return typeof matchOutput === "function"
      ? (matchOutput as MatchHandler<P, X>)(matchState)
      : matchOutput;
  }

  /**
   * Adds an entry to the browser's session history
   * (similarly to [`history.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)).
   */
  assign(location: LocationValue) {
    this._navigate(location);
  }

  /**
   * Replaces the current history entry
   * (similarly to [`history.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)).
   */
  replace(location: LocationValue) {
    this._navigate(location, "replace");
  }

  reload() {
    this._navigate();
  }

  /*
   * Jumps the specified number of the browser history entries away
   * from the current entry.
   */
  go(delta: number): void {
    if (typeof window !== "undefined" && window.history)
      window.history.go(delta);
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  get href(): string {
    return this._href;
  }

  set href(location: LocationValue) {
    this._navigate(location);
  }

  get pathname(): string {
    return new QuasiURL(this._href).pathname;
  }

  set pathname(value: LocationValue) {
    let url = new QuasiURL(this._href);
    url.pathname = value ? String(value) : "";
    this._navigate(url.href);
  }

  get search(): string {
    return new QuasiURL(this._href).search;
  }

  set search(value: string | URLSearchParams) {
    let url = new QuasiURL(this._href);
    url.search = value;
    this._navigate(url.href);
  }

  get hash() {
    return new QuasiURL(this._href).hash;
  }

  set hash(value: string) {
    let url = new QuasiURL(this._href);
    url.hash = value;
    this._navigate(url.href);
  }

  /**
   * Returns the current location, equal to `.href`.
   */
  toString(): string {
    return this._href;
  }
}
