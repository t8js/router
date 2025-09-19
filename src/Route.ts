import {QuasiURL} from 'quasiurl';
import {observe} from './observe';
import type {LocationPattern} from './types/LocationPattern';
import type {LocationValue} from './types/LocationValue';
import type {MatchHandler} from './types/MatchHandler';
import type {NavigationCallback} from './types/NavigationCallback';
import type {NavigationEvent} from './types/NavigationEvent';
import type {NavigationMode} from './types/NavigationMode';
import type {URLData} from './types/URLData';
import {compileHref} from './utils/compileHref';
import {getMatchState} from './utils/getMatchState';
import {isSameOrigin} from './utils/isSameOrigin';

export class Route {
    _href = '';
    _cleanup: (() => void) | null = null;
    _handlers: Record<NavigationEvent, NavigationCallback[]> = {
        navigationstart: [],
        navigationcomplete: [],
    };
    _navigationQueue: [
        LocationValue | undefined,
        NavigationMode | undefined,
    ][] = [];
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
         * @defaultValue 'a, area'
         */
        elements?: Parameters<typeof observe>[2],
    ) {
        return observe(this, container, elements);
    }

    on(event: NavigationEvent, callback: NavigationCallback) {
        if (!(event in this._handlers))
            throw new Error(`Unknown event type: '${event}'`);

        this._handlers[event].push(callback);

        if (this.connected && this._navigated) callback(this.href, this.href);

        return () => {
            for (let i = this._handlers[event].length - 1; i >= 0; i--) {
                if (this._handlers[event][i] === callback)
                    this._handlers[event].splice(i, 1);
            }
        };
    }

    _init(location?: LocationValue) {
        if (typeof window === 'undefined')
            return;

        let handleNavigation = () => {
            this._navigate();
        };

        window.addEventListener('popstate', handleNavigation);

        this._cleanup = () => {
            window.removeEventListener('popstate', handleNavigation);
        };

        // Allow setting up event handlers before the first navigation.
        setTimeout(() => {
            this._navigate(location).then(() => {
                this._navigated = true;
            });
        }, 0);
    }

    _getHref(location: LocationValue) {
        let url: string;

        if (location === undefined || location === null)
            url = typeof window === 'undefined' ? '' : window.location.href;
        else url = String(location);

        let {origin, pathname, search, hash, href} = new QuasiURL(url);

        if (isSameOrigin(href)) origin = '';

        return `${origin}${pathname}${search}${hash}`;
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

        for (let callback of [
            ...this._handlers.navigationstart,
            this._transition,
        ]) {
            let result = callback(nextHref, prevHref, navigationMode);

            if ((result instanceof Promise ? await result : result) === false)
                return;
        }

        this._href = nextHref;

        for (let callback of this._handlers.navigationcomplete) {
            let result = callback(nextHref, prevHref, navigationMode);

            if (result instanceof Promise) await result;
        }

        this.navigating = false;

        let pendingNavigation = this._navigationQueue.shift();

        if (pendingNavigation !== undefined)
            await this._navigate.apply(this, pendingNavigation);
    }

    _transition: NavigationCallback = (
        nextHref,
        _prevHref,
        navigationMode = 'assign',
    ) => {
        if (typeof window === 'undefined') return;

        if (
            !this._navigated &&
            this._getHref(window.location.href) === nextHref
        )
            return;

        if (!window.history || !isSameOrigin(nextHref)) {
            switch (navigationMode) {
                case 'assign':
                    window.location.assign(nextHref);
                    break;
                case 'replace':
                    window.location.replace(nextHref);
                    break;
            }

            return;
        }

        switch (navigationMode) {
            case 'assign':
                window.history.pushState({}, '', nextHref);
                break;
            case 'replace':
                window.history.replaceState({}, '', nextHref);
                break;
        }
    };

    /**
     * Matches the current location against the location pattern.
     */
    match<P extends LocationPattern>(locationPattern: P) {
        return getMatchState<P>(locationPattern, this._href);
    }

    compile<T extends LocationValue>(location: T, state?: URLData<T>) {
        return compileHref(location, state);
    }

    /**
     * Loosely resembles the conditional ternary operator (`condition ? x : y`):
     * if the current location matches the location pattern the returned value
     * is based on the second parameter, otherwise on the third parameter.
     *
     * `.evaluate(locationPattern, x, y)` returns either `x({params})` or
     * `y({params})` if they are functions, `x` or `y` themselves otherwise.
     */
    resolve<P extends LocationPattern, X = undefined, Y = undefined>(
        locationPattern: P,
        matchOutput?: X | MatchHandler<P, X>,
        mismatchOutput?: Y | MatchHandler<P, Y>,
    ): X | Y | undefined {
        let matchState = getMatchState<P>(locationPattern, this._href);

        if (!matchState.ok)
            return typeof mismatchOutput === 'function'
                ? (mismatchOutput as MatchHandler<P, Y>)(matchState)
                : mismatchOutput;

        return typeof matchOutput === 'function'
            ? (matchOutput as MatchHandler<P, X>)(matchState)
            : matchOutput;
    }

    /**
     * Adds an entry to the browser's session history
     * (similarly to [`history.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).
     */
    assign(location: LocationValue) {
        this._navigate(location, 'assign');
    }

    /**
     * Replaces the current history entry
     * (similarly to [`history.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState).
     */
    replace(location: LocationValue) {
        this._navigate(location, 'replace');
    }

    reload() {
        this._navigate();
    }

    /*
     * Jumps the specified number of the browser history entries away
     * from the current entry.
     */
    go(delta: number): void {
        if (typeof window !== 'undefined' && window.history)
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

    get pathname() {
        return new QuasiURL(this._href).pathname;
    }

    get search() {
        return new QuasiURL(this._href).search;
    }

    get hash() {
        return new QuasiURL(this._href).hash;
    }

    /**
     * Returns the current location, equals `.href`.
     */
    toString(): string {
        return this._href;
    }
}
