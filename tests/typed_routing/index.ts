import { createURLSchema } from "url-shape";
import { z } from "zod";
import { Route } from "../../src/Route";
import "./index.css";

let { url } = createURLSchema({
  "/": z.object({}),
  "/sections/:id": z.object({
    params: z.object({
      id: z.coerce.number(),
    }),
  }),
});

let route = new Route();

route.on("navigationcomplete", () => {
  renderHeader();
  renderMainContent();
});

route.observe(document);

function renderHeader() {
  document.querySelector("header")!.className =
    route.href === url("/").href ? "full" : "compact";
}

function renderMainContent() {
  let { ok, params } = route.match(url("/sections/:id"));

  if (ok)
    document.querySelector('[data-id="section"] h2 span')!.textContent = String(
      params.id,
    );

  document
    .querySelector('main[data-id="intro"]')!
    .toggleAttribute("hidden", ok);

  document
    .querySelector('main[data-id="section"]')!
    .toggleAttribute("hidden", !ok);

  document.body.removeAttribute("hidden");
}
