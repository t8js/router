import { Route } from "../../src/Route.ts";
import "./index.css";

let route = new Route();

route.on("navigationstart", ({ href }) => {
  if (href === "/") {
    route.href = "/sections/1"; // redirection
    return false;
  }
});

route.on("navigationcomplete", () => {
  renderHeader();
  renderMainContent();
});

route.observe(document);

function renderHeader() {
  document.querySelector("header")!.className = route.at(
    "/",
    "full",
    "compact",
  );
}

function renderMainContent() {
  let { ok, params } = route.match(/^\/sections\/(?<id>\d+)\/?/);

  if (ok)
    document.querySelector('[data-id="section"] h2 span')!.textContent =
      params.id ?? "";

  document
    .querySelector('main[data-id="intro"]')!
    .toggleAttribute("hidden", ok);

  document
    .querySelector('main[data-id="section"]')!
    .toggleAttribute("hidden", !ok);

  document.body.removeAttribute("hidden");
}
