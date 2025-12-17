import { Route } from "../../src/Route.ts";
import "./index.css";

let route = new Route();

route.on("navigationcomplete", () => {
  render();
});

route.observe(document);

function render() {
  document
    .querySelector('main[data-id="intro"]')!
    .toggleAttribute("hidden", route.href !== "/");

  document
    .querySelector('main[data-id="story"]')!
    .toggleAttribute("hidden", route.href !== "/story");

  document.body.removeAttribute("hidden");
}
