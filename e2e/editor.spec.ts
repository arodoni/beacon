import { test, expect } from "@playwright/test";

test.describe("Editor page", () => {
  test("renders the default document with typography styling", async ({ page }) => {
    await page.goto("/editor");

    const preview = page.getByTestId("markdown-preview");
    const heading = preview.locator("h1");
    const paragraph = preview.locator("p").first();

    await expect(heading).toHaveText("Beacon");

    // Regression guard: a `not-prose` ancestor around the Editor page used to
    // suppress all Tailwind Typography styling inside the nested preview
    // pane, so every element rendered at the same size as plain text.
    const headingSize = await heading.evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize)
    );
    const paragraphSize = await paragraph.evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize)
    );
    expect(headingSize).toBeGreaterThan(paragraphSize);
  });

  test("live preview updates as markdown is typed", async ({ page }) => {
    await page.goto("/editor");

    const textarea = page.getByLabel("Markdown editor");
    await textarea.fill("# Hello Test\n\n- item one\n- item two\n");

    const preview = page.getByTestId("markdown-preview");
    await expect(preview.locator("h1")).toHaveText("Hello Test");
    await expect(preview.locator("li")).toHaveCount(2);

    const headingSize = await preview
      .locator("h1")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const listItemSize = await preview
      .locator("li")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(headingSize).toBeGreaterThan(listItemSize);
  });
});
