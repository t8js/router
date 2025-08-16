export function getQuery(href: string): Record<string, string> {
    let queryIndex = href.indexOf('?');

    if (queryIndex === -1) return {};

    return Object.fromEntries(new URLSearchParams(href.slice(queryIndex)));
}
