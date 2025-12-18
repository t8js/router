import { QuasiURL } from "quasiurl";
import { observe } from "./observe.ts";
import type { LocationPattern } from "./types/LocationPattern.ts";
import type { LocationValue } from "./types/LocationValue.ts";
import type { MatchHandler } from "./types/MatchHandler.ts";
import type { NavigationCallback } from "./types/NavigationCallback.ts";
import type { NavigationEvent } from "./types/NavigationEvent.ts";
import type { NavigationOptions } from "./types/NavigationOptions.ts";
import type { URLData } from "./types/URLData.ts";
import { isLocationObject } from "./utils/isLocationObject.ts";
import { isSameOrigin } from "./utils/isSameOrigin.ts";
import { match } from "./utils/match.ts";
import { toStringMap } from "./utils/toStringMap.ts";

function toHref(url: LocationValue): string {
  return url ? String(url) : "";
}

export class Route {
  _href = "";
  _cleanup: (() => void) | null = null;
  _callbacks: Record<NavigationEvent, Set<NavigationCallback>> = {
    navigationstart: new Set(),
    navigationcomplete: new Set(),
  };
  _queue: (NavigationOptions | undefined)[] = [];
  _inited = false;

  active = false;
  navigating = false;

  constructor(url?: LocationValue) {
    this.start(url);
  }

  /**
   * Signals the route instance to start listening to browser history
   * navigation events and notify the subscribers.
   *
   * A route instance is automatically started once it's created. By
   * calling `start()`, it can be restarted after being stopped.
   */
  start(url?: LocationValue) {
    this.active = true;
    this._href = this._getHref(url);
    this._init(url);

    return this;
  }

  /**
   * Signals the route instance to stop listening to browser history
   * navigation events and notifying the subscribers.
   *
   * It can be restarted by calling the `start()` method.
   */
  stop() {
    this.active = false;
    this._cleanup?.();
    this._inited = false;
    this._queue = [];
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
   * Adds a callback to handle a route event.
   */
  on(
    event: NavigationEvent,
    callback: NavigationCallback,
    skipInitialCall = false,
  ) {
    if (!(event in this._callbacks))
      throw new Error(`Unknown event type: '${event}'`);

    this._callbacks[event].add(callback);

    if (this.active && this._inited && !skipInitialCall)
      callback({ href: this.href, referrer: this.href });

    return () => {
      this._callbacks[event].delete(callback);
    };
  }

  /**
   * Initializes the route instance when it's created or restarted.
   */
  _init(url?: LocationValue) {
    if (typeof window === "undefined") return;

    this._cleanup = this._connect();

    // Allow setting up event handlers before the first navigation.
    Promise.resolve()
      .then(() => this._navigate({ href: toHref(url) }))
      .then(() => {
        this._inited = true;
      });
  }

  /**
   * Adds a listener to an external source of navigation events.
   */
  _connect(): () => void {
    let navigationHandler = () => {
      this._navigate();
    };

    window.addEventListener("popstate", navigationHandler);

    return () => {
      window.removeEventListener("popstate", navigationHandler);
    };
  }

  /**
   * Defines how the `href` property is calculated.
   */
  _getHref(url?: LocationValue): string {
    let href = String(url ?? (typeof window === "undefined" ? "" : window.location.href));
    let urlObject = new QuasiURL(href);

    if (isSameOrigin(urlObject)) urlObject.origin = "";

    return urlObject.href;
  }

  /**
   * Defines the course of the navigation process.
   */
  async _navigate(options?: NavigationOptions): Promise<void> {
    if (!this.active) return;

    if (this.navigating) {
      this._queue.push(options);
      return;
    }

    this.navigating = true;

    let prevHref = this._href;
    let nextHref = this._getHref(options?.href);

    let payload: NavigationOptions = {
      ...options,
      href: nextHref,
      referrer: prevHref,
    };

    let quit = async () => {
      this.navigating = false;

      if (this._queue.length !== 0) await this._navigate(this._queue.shift());
    };

    for (let callback of this._callbacks.navigationstart) {
      let result = callback(payload);

      if ((result instanceof Promise ? await result : result) === false)
        return quit();
    }

    if (this._inited || this._getHref() !== nextHref) {
      let result = this._transition(payload);

      if ((result instanceof Promise ? await result : result) === false)
        return quit();
    }

    this._href = nextHref;

    for (let callback of this._callbacks.navigationcomplete) {
      let result = callback(payload);

      if (result instanceof Promise) await result;
    }

    let result = this._complete(payload);

    if (result instanceof Promise) await result;

    await quit();
  }

  /**
   * Performs the actual transition to the next `href` value.
   * Involves navigation via History API or `window.location`.
   */
  _transition(payload: NavigationOptions): ReturnType<NavigationCallback> {
    if (typeof window === "undefined") return;

    let target = payload?.target;
    let href = payload?.href;

    if ((target && target !== "_self") || href === undefined) return;

    if (!window.history || !isSameOrigin(href) || payload?.spa === "off") {
      window.location[payload?.history === "replace" ? "replace" : "assign"](
        String(href),
      );
      return;
    }

    window.history[
      payload?.history === "replace" ? "replaceState" : "pushState"
    ]({}, "", String(href));
  }

  /**
   * Performs actions after a navigation and its callbacks.
   * Scrolls to the element matching the URL fragment if the element
   * is available or to the top of the page otherwise.
   */
  _complete(payload: NavigationOptions): ReturnType<NavigationCallback> {
    if (typeof window === "undefined" || payload?.scroll === "off") return;

    let target = payload?.target;
    let href = payload?.href;

    if ((target && target !== "_self") || href === undefined) return;

    let { hash } = new QuasiURL(String(href));
    let targetElement =
      hash === ""
        ? null
        : document.querySelector(`${hash}, a[name="${hash.slice(1)}"]`);

    if (targetElement) targetElement.scrollIntoView();
    else window.scrollTo(0, 0);
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
    this._navigate({ href: toHref(url) });
  }

  /**
   * Navigates to `url` by replacing the current browser's history
   * entry (similarly to [`history.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)).
   */
  replace(url: LocationValue) {
    this._navigate({ href: toHref(url), history: "replace" });
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
    this._navigate({ href: toHref(url) });
  }

  get pathname(): string {
    return new QuasiURL(this._href).pathname;
  }

  set pathname(value: LocationValue) {
    let url = new QuasiURL(this._href);
    url.pathname = value ? String(value) : "";
    this._navigate({ href: url.href });
  }

  get search(): string {
    return new QuasiURL(this._href).search;
  }

  set search(value: string | URLSearchParams) {
    let url = new QuasiURL(this._href);
    url.search = value;
    this._navigate({ href: url.href });
  }

  get hash() {
    return new QuasiURL(this._href).hash;
  }

  set hash(value: string) {
    let url = new QuasiURL(this._href);
    url.hash = value;
    this._navigate({ href: url.href });
  }

  /**
   * Returns the current location, equal to `.href`.
   */
  toString(): string {
    return this._href;
  }
}
