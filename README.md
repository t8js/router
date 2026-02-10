# T8 Router

Vanilla JS/TS router for SPA navigation and URL pattern matching

<!-- docsgen-hide-start -->
Concise API for SPA navigation&nbsp;&middot; Flexible URL pattern matching for URL-based rendering&nbsp;&middot; Navigation middleware

This approach is applicable to React apps as well, see [T8 React Router](https://github.com/t8js/react-router) for more details.
<!-- docsgen-hide-end -->

<!-- docsgen-show-start --
⬥ Concise API for SPA navigation

```js
let route = new Route();

route.observe(document); // switch links to the SPA navigation mode
```

```diff
- window.location.assign("/intro");
+ route.assign("/intro"); // SPA navigation

- window.location.href = "/intro";
+ route.href = "/intro"; // SPA navigation
```

⬥ Flexible URL pattern matching for URL-based rendering

```js
header.className = route.href === "/" ? "full" : "compact";
```

```js
header.className = route.at("/", "full", "compact");
// at "/" ? "full" : "compact"
```

```js
let sectionTitle = route.at(
  /^\/sections\/(?<id>\d+)\/?/,
  ({ params }) => `Section ${params.id}`
);
// at "/sections/<id>" ? "Section <id>" : undefined
```

⬥ Navigation middleware

```js
route.on("navigationstart", callback);
// e.g. to redirect or prevent navigation
```

```js
route.on("navigationcomplete", callback);
// e.g. to set the document's title
```
-- docsgen-show-end -->

## Initialization

A `Route` instance exposes methods for URL navigation without full-page reloads resembling the methods exposed by `window.location` for regular URL navigation.

```js
import { Route } from "@t8/router";

let route = new Route();
```

⬥ The `new Route(url)` constructor accepts an optional URL. In the browser, the current URL is implied if `url` is omitted.

## Navigation

```diff
- window.location.assign("/intro");
+ route.assign("/intro");

- window.location.replace("/intro");
+ route.replace("/intro");

- window.location.href = "/intro";
+ route.href = "/intro";

- console.log(window.location.href);
+ console.log(route.href);
```

⬥ The route navigation API is largely in line with the built-in navigation APIs. An instance of `Route` exposes: `.assign(url)`, `.replace(url)`, `.reload()`, `.href`, `.pathname`, `.search`, `.hash`, `.back()`, `.forward()`, `.go(delta)` — similar to the built-in APIs of `window.location` and `history` carried over to route-based SPA navigation.

⬥ For a full-featured navigation, `route.navigate(options)` can be used instead of `route.assign(url)` and `route.replace(url)` serving as a handy drop-in replacement for the similar `window.location` methods. The `options` parameter is an object combining values corresponding to the link navigation attributes described below, with the `data-` prefix stripped from the attribute names.

```js
route.navigate({ href: "/intro", history: "replace", scroll: "off" });
```

## Link attributes

Apart from regular HTML link attributes, SPA links can have a few optional attributes related to SPA navigation:

⬥ `data-history="replace"` added to a link changes its navigation mode, so that clicking the link replaces the current history navigation entry rather than keeps it as a previous record (similarly to calling `route.replace(url)`), effectively preventing the user from returning to the current URL by pressing the browser's *Back* button.

⬥ `data-spa="off"` turns off SPA navigation for the given link and makes it act like an ordinary HTML link triggering a full-page reload.

⬥ `data-scroll="off"` turns off the default scrolling behavior when the link with this attribute is clicked. By default, similarly to the behavior of regular HTML links, the page is scrolled either to the element whose `id` matches the link fragment (like `#example`) if the element is available or to the top of the page otherwise.

⬥ Together with `href` and `target`, values of the attributes listed above shape the navigation mode of the given link. These values can be passed as a parameter to `route.navigate(options)` and they are available as a callback parameter in the routing middleware discussed below.

## Events & Middleware

Subscription to the `Route`'s navigation events allows to hook into the course of the route navigation, with event handlers effectively acting like routing middleware.

```js
route.on("navigationstart", ({ href }) => {
  if (hasUnsavedChanges)
    return false; // prevents navigation

  if (href === "/") {
    route.assign("/intro"); // redirection
    return false; // prevents navigation
  }
});
```

```js
route.on("navigationcomplete", ({ href }) => {
  if (href === "/intro")
    document.title = "Intro";
});
```

⬥ Handlers of both events are immediately called when they are added if the route is already in the navigation-complete state.

## Route matching

```js
console.log(route.href === "/intro");
console.log(route.href.startsWith("/sections/"));
console.log(/^\/sections\/\d+\/?/.test(route.href));
```

```js
let { ok, params } = route.match(/^\/sections\/(?<id>\d+)\/?/);

console.log(ok, params.id, params[0]);
```

```js
header.className = route.at("/", "full", "compact");
// at "/" ? "full" : "compact"

let sectionTitle = route.at(
  /^\/sections\/(?<id>\d+)\/?/,
  ({ params }) => `Section ${params.id}`
);
// at "/sections/<id>" ? "Section <id>" : undefined
```

⬥ With a regular expression route pattern, `params` contains values of its capturing groups accessible by numeric indices; named capturing group values can also be retrieved by their names (like `params.id` in the examples above).

⬥ Type-safe `params` can be obtained by providing a type-safe URL pattern, such as produced by [*url-shape*](https://github.com/t8js/url-shape#readme), to `route.match(pattern)` or `route.at(pattern, x, y)`.

## Converting HTML links to SPA route links

```js
route.observe(document);
```

The above line turns all `<a>` and `<area>` elements in the `document` to SPA route links enabling navigation without page reloads via the `route` object.

⬥ `route.observe(container, elements)` accepts a container element (it can be `document`, as in the example above) and optionally `elements` (which can be a selector or HTML elements) specifying the SPA navigation links.

```js
route.observe(document.querySelector("#app"), "nav a");
```

---

- [Basic usage example](https://codesandbox.io/p/sandbox/n7y5rx?file=%2Fsrc%2Findex.ts&h=320)
- [T8 React Router](https://github.com/t8js/react-router)
