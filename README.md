[![npm](https://flat.badgen.net/npm/v/@t8/router?labelColor=345&color=46e)](https://www.npmjs.com/package/@t8/router) ![Lightweight](https://flat.badgen.net/bundlephobia/minzip/@t8/router/?label=minzip&labelColor=345&color=46e&r=0) ![TypeScript ✓](https://flat.badgen.net/badge/TypeScript/✓?labelColor=345&color=345)

# @t8/router

*Vanilla JS/TS browser history router*

Installation: `npm i @t8/router`

## Initialization

```js
import {Route} from '@t8/router';

let route = new Route();
```

🔹 The `new Route(location)` constructor accepts an optional URL location. If omitted, it's the browser's current URL.

## Navigation

```diff
- window.location.assign('/intro');
+ route.assign('/intro');

- window.location.replace('/intro');
+ route.replace('/intro');

- console.log(window.location.href);
+ console.log(route.href);
```

## Events & Middleware

```js
route.on('navigationstart', href => {
    if (hasUnsavedChanges)
        return false;

    if (href === '/') {
        route.assign('/intro');
        return false; // prevents navigation
    }
});
```

```js
route.on('navigationcomplete', href => {
    if (href === '/intro')
        document.title = 'Intro';
});
```

🔹 Both event handlers, acting like routing middleware, are immediately called when they are added if the route is already in the navigation-complete state.

## Route matching

```js
console.log(route.href === '/intro');
console.log(route.href.startsWith('/sections'));
console.log(/\/sections\/\d+\/?/.test(route.href));
```

```js
let {ok, params} = route.match(/\/sections\/(?<id>\d+)\/?/);

console.log(ok, params.id);
```

🔹 Type-safe `params` can be obtained by providing a type-safe URL pattern, such as produced by `url-shape`, to the `route.match(pattern)` method.

## Converting HTML links to SPA route links

```js
route.observe(document);
```

The above line turns all `a` and `area` elements in the `document` to SPA route links enabling navigation without page reloads via History API.

🔹 `route.observe(container, elements)` accepts a container element (it can be `document`, as in the example above) and optionally `elements` (which can be a selector or HTML elements).

---

- [Basic usage example](https://codesandbox.io/p/sandbox/n7y5rx?file=%2Fsrc%2Findex.ts)
