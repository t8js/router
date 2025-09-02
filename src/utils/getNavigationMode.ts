import type {LinkNavigationProps} from '../types/LinkNavigationProps';
import type {NavigationMode} from '../types/NavigationMode';

export function getNavigationMode(
    x: HTMLElement | LinkNavigationProps,
): NavigationMode | undefined {
    if ('dataset' in x)
        return x.dataset.navigationMode as NavigationMode | undefined;

    return x['data-navigation-mode'];
}
