[![npm](https://flat.badgen.net/npm/v/@t8/router?labelColor=345&color=46e)](https://www.npmjs.com/package/@t8/router) ![Lightweight](https://flat.badgen.net/bundlephobia/minzip/@t8/router/?label=minzip&labelColor=345&color=46e&r=0) ![TypeScript ✓](https://flat.badgen.net/badge/TypeScript/✓?labelColor=345&color=345)

# @t8/router

*Vanilla JS/TS router*

<!-- docsgen-hide-start -->
- Concise API for SPA navigation
- Flexible URL pattern matching for URL-based rendering
- Navigation middleware
<!-- docsgen-hide-end -->

<!-- docsgen-show-start --
🔹 Concise API for SPA navigation

```js
let route = new Route();

route.observe(document); // switch links to SPA navigation mode
```

```diff
- window.location.assign("/intro");
+ route.assign("/intro");

- window.location.href = "/intro";
+ route.href = "/intro";
```

🔹 Flexible URL pattern matching for URL-based rendering

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

🔹 Navigation middleware

```js
route.on("navigationstart", callback);
// e.g. to redirect or prevent navigation
```

```js
route.on("navigationcomplete", callback);
// e.g. to set the document's title
```
-- docsgen-show-end -->

Installation: `npm i @t8/router`

## Initialization

```js
import { Route } from "@t8/router";

let route = new Route();
```

🔹 The `new Route(location)` constructor accepts an optional URL location. In the browser, the current URL is implied if `location` is omitted.

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

🔹 The route navigation API is largely in line with the built-in navigation APIs. An instance of `Route` exposes: `.assign(url)`, `.replace(url)`, `.reload()`, `.href`, `.pathname`, `.search`, `.hash`, `.back()`, `.forward()`, `.go(delta)` — similar to the built-in APIs of `window.location` and `history` carried over to route-based SPA navigation.

## Events & Middleware

```js
route.on("navigationstart", href => {
  if (hasUnsavedChanges)
    return false; // prevents navigation

  if (href === "/") {
    route.assign("/intro"); // redirection
    return false; // prevents navigation
  }
});
```

```js
route.on("navigationcomplete", href => {
  if (href === "/intro")
    document.title = "Intro";
});
```

🔹 Both event handlers, acting like routing middleware, are immediately called when they are added if the route is already in the navigation-complete state.

## Route matching

```js
console.log(route.href === "/intro");
console.log(route.href.startsWith("/sections/"));
console.log(/^\/sections\/\d+\/?/.test(route.href));
```

```js
let { ok, params } = route.match(/^\/sections\/(?<id>\d+)\/?/);

console.log(ok, params.id);
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

🔹 Type-safe `params` can be obtained by providing a type-safe URL pattern, such as produced by [*url-shape*](https://github.com/t8js/url-shape#readme), to `route.match(pattern)` or `route.at(pattern, x, y)`.

## Converting HTML links to SPA route links

```js
route.observe(document);
```

The above line turns all `<a>` and `<area>` elements in the `document` to SPA route links enabling navigation without page reloads via the `route` object.

🔹 `route.observe(container, elements)` accepts a container element (it can be `document`, as in the example above) and optionally `elements` (which can be a selector or HTML elements) specifying the SPA navigation links.

```js
route.observe(document.querySelector("#app"), "nav a");
```

---

- [Basic usage example](https://codesandbox.io/p/sandbox/n7y5rx?file=%2Fsrc%2Findex.ts)
- [React router](https://github.com/t8js/react-router)
