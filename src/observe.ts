import type {Route} from './Route';
import {getNavigationMode} from './utils/getNavigationMode';
import {isArrayLike} from './utils/isArrayLike';
import {isLinkElement} from './utils/isLinkElement';
import {isRouteEvent} from './utils/isRouteEvent';

export function observe(
    route: Route,
    container: Element | Document | null | undefined,
    /**
     * A selector, or an HTML element, or a collection thereof.
     *
     * @defaultValue 'a, area'
     */
    elements:
        | string
        | Node
        | (string | Node)[]
        | HTMLCollection
        | NodeList = 'a, area',
) {
    let handleClick = (event: MouseEvent) => {
        if (!route.connected || !container) return;

        if (event.defaultPrevented) return;

        let activeElement: HTMLAnchorElement | HTMLAreaElement | null = null;
        let connectedElements = isArrayLike(elements)
            ? Array.from(elements)
            : [elements];

        for (let connectedElement of connectedElements) {
            let element: Node | null = null;

            if (typeof connectedElement === 'string')
                element =
                    event.target instanceof HTMLElement
                        ? event.target.closest(connectedElement)
                        : null;
            else element = connectedElement;

            if (
                isLinkElement(element) &&
                container.contains(element) &&
                isRouteEvent(event, element)
            ) {
                activeElement = element;
                break;
            }
        }

        if (!activeElement) return;

        event.preventDefault();

        if (getNavigationMode(activeElement) === 'replace')
            route.replace(activeElement.href);
        else route.assign(activeElement.href);
    };

    document.addEventListener('click', handleClick);

    return () => {
        document.removeEventListener('click', handleClick);
    };
}
