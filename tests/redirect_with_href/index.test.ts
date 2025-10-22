import { expect, type Page, test } from "@playwright/test";
import { type Server, serve } from "@t8/serve";

class Playground {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }
  async clickLink(name: string) {
    await this.page.getByRole("link", { name }).click();
  }
  async hasPath(value: string) {
    await expect(this.page).toHaveURL(
      ({ pathname, search }) => pathname + search === value,
    );
  }
  async hasSectionTitle(value: string) {
    await expect(this.page.locator("h2:visible")).toHaveText(value);
  }
  async hasCompactHeader() {
    await expect(this.page.locator("header")).toHaveClass("compact");
  }
}

let server: Server;

test.beforeAll(async () => {
  server = await serve({
    path: "tests/redirect_with_href",
    bundle: true,
    spa: true,
  });
});

test.afterAll(() => {
  server.close();
});

test("redirect with href", async ({ page }) => {
  let p = new Playground(page);

  await page.goto("/");
  await p.hasPath("/sections/1");
  await p.hasCompactHeader();

  await p.clickLink("Section 2");
  await p.hasPath("/sections/2");
  await p.hasSectionTitle("Section 2");
  await p.hasCompactHeader();

  await p.clickLink("Intro");
  await p.hasPath("/sections/1");
  await p.hasSectionTitle("Section 1");
  await p.hasCompactHeader();

  await p.clickLink("Section 1");
  await p.hasPath("/sections/1");
  await p.hasSectionTitle("Section 1");
  await p.hasCompactHeader();

  await p.clickLink("Section 2");
  await p.hasPath("/sections/2");
  await p.hasSectionTitle("Section 2");
  await p.hasCompactHeader();
});
