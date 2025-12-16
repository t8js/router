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
  /**
   * Revision changes on each navigation (unlike `href`).
   */
  revision = -1;

  constructor(url?: LocationValue) {
    this.connect(url);
  }

  /**
   * Signals the route instance to start listening to browser history
   * navigation events and notify the subscribers.
   *
   * A route instance is automatically connected once it's created. By
   * calling `connect()`, it can be reconnected after it was disconnected.
   */
  connect(url?: LocationValue) {
    this.connected = true;
    this._href = this._getHref(url);
    this._init(url);

    return this;
  }

  /**
   * Signals the route instance to stop listening to browser history
   * navigation events and notifying the subscribers.
   *
   * It can reconnected by calling the `connect()` method.
   */
  disconnect() {
    this.connected = false;
    this._cleanup?.();
    this._navigated = false;
    this._navigationQueue = [];
  }

  /**
   * Converts plain HTML links to SPA route links by channeling their
   * clicks to browser history navigation preventing full-page reloads.
   *
   * @param container - A container element or a function returning a
   * container element.
   * @param elements - An optional selector, or an HTML element, or a
   * collection thereof, specifying the links inside the container to
   * be converted to SPA route links. Default: `"a, area"`.
   */
  observe(
    container: Parameters<typeof observe>[1],
    elements?: Parameters<typeof observe>[2],
  ) {
    return observe(this, container, elements);
  }

  /**
   * Adds a route event listener.
   */
  on(event: NavigationEvent, callback: NavigationCallback) {
    if (!(event in this._handlers))
      throw new Error(`Unknown event type: '${event}'`);

    this._handlers[event].add(callback);

    if (this.connected && this._navigated) callback(this.href, this.href);

    return () => {
      this._handlers[event].delete(callback);
    };
  }

  _init(url?: LocationValue) {
    if (typeof window === "undefined") return;

    this._cleanup = this._subscribe();

    // Allow setting up event handlers before the first navigation.
    Promise.resolve()
      .then(() => this._navigate(url))
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

  _getHref(url?: LocationValue) {
    let urlObject = new QuasiURL(
      String(
        url ?? (typeof window === "undefined" ? "" : window.location.href),
      ),
    );

    if (isSameOrigin(urlObject.href)) urlObject.origin = "";

    return urlObject.href;
  }

  async _navigate<T extends LocationValue>(
    url?: T,
    navigationMode?: NavigationMode,
  ): Promise<void> {
    if (!this.connected) return;

    if (this.navigating) {
      this._navigationQueue.push([url, navigationMode]);
      return;
    }

    this.navigating = true;

    let prevHref = this._href;
    let nextHref = this._getHref(url);

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
    this.revision = Math.random();

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
   * Matches the current location against `urlPattern`.
   */
  match<P extends LocationPattern>(urlPattern: P) {
    return match<P>(urlPattern, this._href);
  }

  /**
   * Compiles `urlPattern` to a URL string by filling out the parameters
   * based on `data`.
   */
  compile<T extends LocationValue>(urlPattern: T, data?: URLData<T>) {
    if (isLocationObject(urlPattern)) return urlPattern.compile(data);

    let url = new QuasiURL(urlPattern ?? "");
    let inputQuery = data?.query;

    if (inputQuery) url.search = new URLSearchParams(toStringMap(inputQuery));

    return url.href;
  }

  /**
   * Checks whether `urlPattern` matches the current URL and returns either
   * based on `x` if there is a match, or based on `y` otherwise. (It
   * loosely resembles the ternary conditional operator
   * `matchesPattern ? x : y`.)
   *
   * If the current location matches `urlPattern`, `at(urlPattern, x, y)`
   * returns:
   * - `x`, if `x` is not a function;
   * - `x({ params })`, if `x` is a function, with `params` extracted from
   * the current URL.
   *
   * If the current location doesn't match `urlPattern`, `at(urlPattern, x, y)`
   * returns:
   * - `y`, if `y` is not a function;
   * - `y({ params })`, if `y` is a function, with `params` extracted from
   * the current URL.
   */
  at<P extends LocationPattern, X>(
    urlPattern: P,
    matchOutput: X | MatchHandler<P, X>,
  ): X | undefined;

  at<P extends LocationPattern, X, Y>(
    urlPattern: P,
    matchOutput: X | MatchHandler<P, X>,
    mismatchOutput: Y | MatchHandler<P, Y>,
  ): X | Y;

  at<P extends LocationPattern, X, Y>(
    urlPattern: P,
    matchOutput: X | MatchHandler<P, X>,
    mismatchOutput?: Y | MatchHandler<P, Y>,
  ): X | Y | undefined {
    let matchState = match<P>(urlPattern, this._href);

    if (!matchState.ok)
      return typeof mismatchOutput === "function"
        ? (mismatchOutput as MatchHandler<P, Y>)(matchState)
        : mismatchOutput;

    return typeof matchOutput === "function"
      ? (matchOutput as MatchHandler<P, X>)(matchState)
      : matchOutput;
  }

  /**
   * Navigates to `url` by adding an entry to the browser's session
   * history (similarly to [`history.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)).
   */
  assign(url: LocationValue) {
    this._navigate(url);
  }

  /**
   * Navigates to `url` by replacing the current browser's history
   * entry (similarly to [`history.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)).
   */
  replace(url: LocationValue) {
    this._navigate(url, "replace");
  }

  /**
   * Navigates to the current URL and renotifies the subscribers.
   */
  reload() {
    this._navigate();
  }

  /**
   * Jumps the specified number of the browser history entries away
   * from the current entry.
   */
  go(delta: number): void {
    if (typeof window !== "undefined" && window.history)
      window.history.go(delta);
  }

  /**
   * Navigates to the previous browser history entry.
   */
  back() {
    this.go(-1);
  }

  /**
   * Navigates to the next browser history entry, if it's available.
   */
  forward() {
    this.go(1);
  }

  get href(): string {
    return this._href;
  }

  set href(url: LocationValue) {
    this._navigate(url);
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
