import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The component contract, checked in a real layout engine. The built
// stylesheet is injected into small fixtures, so the tests measure what a
// consumer gets rather than the SCSS.
//
// Run with `make test-browser` (or `npm run test:browser`). Playwright uses its
// own headless Chromium, installed with `npx playwright install chromium`.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS = path.join(ROOT, "dist", "paper.css");
const TALL_LINES = 120;

// The built stylesheet makes no third-party request (the web fonts are opt-in),
// so the fixtures below need no network stubbing.
async function load(page, html) {
  await page.setContent(html);
  await page.addStyleTag({ path: CSS });
}

// Geometry assertions should see the end state, not a 235ms transition.
async function withoutTransitions(page) {
  await page.addStyleTag({ content: "* { transition: none !important }" });
}

const bodyHeight = (page, inputId) =>
  page.evaluate(
    (id) =>
      Math.round(
        document
          .getElementById(id)
          .parentElement.querySelector(".collapsible-body")
          .getBoundingClientRect().height
      ),
    inputId
  );

const tallLines = (n) => "line<br>".repeat(n);

test.describe("standalone collapsible", () => {
  test.beforeEach(async ({ page }) => {
    await load(
      page,
      `<!doctype html><html lang="en"><body>
        <div class="collapsible">
          <input id="collapsible1" type="checkbox" name="collapsible" />
          <label for="collapsible1">Toggle</label>
          <div class="collapsible-body"><span id="tall"></span></div>
        </div>
      </body></html>`
    );
    await page.evaluate((n) => {
      document.getElementById("tall").innerHTML = "line<br>".repeat(n);
    }, TALL_LINES);
  });

  test("the toggle is focusable and not display:none", async ({ page }) => {
    const input = page.locator("#collapsible1");
    expect(await input.evaluate((el) => getComputedStyle(el).display)).not.toBe("none");
    await input.focus();
    await expect(input).toBeFocused();
  });

  test("clicking the label opens and closes a tall body in full", async ({ page }) => {
    await withoutTransitions(page);
    expect(await bodyHeight(page, "collapsible1")).toBeLessThan(5);

    await page.locator('label[for="collapsible1"]').click();
    const open = await bodyHeight(page, "collapsible1");
    expect(open).toBeGreaterThan(960); // the old cap clipped here
    expect(open).toBeGreaterThan(TALL_LINES * 15); // the whole body, not a clipped part

    await page.locator('label[for="collapsible1"]').click();
    expect(await bodyHeight(page, "collapsible1")).toBeLessThan(5);
  });

  test("the keyboard opens and closes the body", async ({ page }) => {
    await withoutTransitions(page);
    await page.locator("#collapsible1").focus();
    await page.keyboard.press("Space");
    expect(await bodyHeight(page, "collapsible1")).toBeGreaterThan(960);
    await page.keyboard.press("Space");
    expect(await bodyHeight(page, "collapsible1")).toBeLessThan(5);
  });

  test("keyboard focus draws an indicator on the visible control", async ({ page }) => {
    await page.keyboard.press("Tab");
    await expect(page.locator("#collapsible1")).toBeFocused();
    const outline = await page
      .locator('label[for="collapsible1"]')
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });

  test("opening animates the grid row", async ({ page }) => {
    const transitionProperty = await page.locator("#collapsible1").evaluate((el) => {
      const body = el.parentElement.querySelector(".collapsible-body");
      return getComputedStyle(body).transitionProperty;
    });
    expect(transitionProperty).toBe("all");

    const animated = await page.evaluate(() => {
      const input = document.getElementById("collapsible1");
      const body = input.parentElement.querySelector(".collapsible-body");
      input.checked = false;
      void body.offsetHeight;
      input.checked = true;
      void body.offsetHeight;
      return body.getAnimations().map((a) => a.transitionProperty);
    });
    expect(animated).toContain("grid-template-rows");
  });
});

test("a body with several children collapses every one of them", async ({ page }) => {
  await load(
    page,
    `<!doctype html><html lang="en"><body>
      <div class="collapsible">
        <input id="collapsible2" type="checkbox" name="collapsible" />
        <label for="collapsible2">Toggle</label>
        <div class="collapsible-body">
          <span>${tallLines(40)}</span>
          <span>${tallLines(20)}</span>
        </div>
      </div>
    </body></html>`
  );
  await withoutTransitions(page);
  expect(await bodyHeight(page, "collapsible2")).toBeLessThan(5);
  await page.locator('label[for="collapsible2"]').click();
  expect(await bodyHeight(page, "collapsible2")).toBeGreaterThan(600);
});

test.describe("navbar", () => {
  test.beforeEach(async ({ page }) => {
    await load(
      page,
      `<!doctype html><html lang="en"><body>
        <nav class="border split-nav">
          <div class="nav-brand"><h3><a href="/">Get PaperCSS</a></h3></div>
          <div class="collapsible">
            <input id="collapsible0" type="checkbox" name="collapsible0" />
            <label for="collapsible0"><span class="bar1"></span><span class="bar2"></span><span class="bar3"></span></label>
            <div class="collapsible-body"><ul class="inline" id="menu"></ul></div>
          </div>
        </nav>
      </body></html>`
    );
    await page.evaluate(() => {
      document.getElementById("menu").innerHTML = Array.from(
        { length: 60 },
        (_, i) => `<li><a href="#">Item ${i + 1}</a></li>`
      ).join("");
    });
  });

  // The documented bars changed from `<div>` to `<span>`. A consumer's
  // selectors are written against the class, so they must keep matching the new
  // element type. This asserts both that the framework's own `.barN` rule still
  // styles the spans and that a consumer's class-based rule does too - the
  // element type is not what selects them.
  test("class-based bar selectors still match the span markup", async ({ page }) => {
    await page.addStyleTag({
      content:
        ".bar1 { border-top: 7px solid red; } .bar2 { border-top: 8px solid red; } .bar3 { border-top: 9px solid red; }",
    });
    const bars = page.locator('label[for="collapsible0"] .bar1, label[for="collapsible0"] .bar2, label[for="collapsible0"] .bar3');
    await expect(bars).toHaveCount(3);
    const measured = await bars.evaluateAll((els) =>
      els.map((el) => {
        const style = getComputedStyle(el);
        return {
          display: style.display,
          width: style.width,
          topBorder: style.borderTopWidth,
          background: style.backgroundColor,
        };
      })
    );
    for (const [index, bar] of measured.entries()) {
      expect(bar.display).toBe("block");
      // `width: 2rem` against the framework's 20px root font size.
      expect(bar.width).toBe("40px");
      expect(bar.topBorder).toBe(`${7 + index}px`);
      expect(bar.background).not.toBe("rgba(0, 0, 0, 0)");
    }
  });

  test("small viewport: focusable toggle reveals a tall menu in full", async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 700 });
    await withoutTransitions(page);
    const input = page.locator("#collapsible0");
    expect(await input.evaluate((el) => getComputedStyle(el).display)).not.toBe("none");
    await input.focus();
    await expect(input).toBeFocused();
    expect(await bodyHeight(page, "collapsible0")).toBeLessThan(20);
    await page.locator('label[for="collapsible0"]').click();
    expect(await bodyHeight(page, "collapsible0")).toBeGreaterThan(1000);
  });

  test("large viewport: the toggle is not a tab stop", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    const input = page.locator("#collapsible0");
    expect(await input.evaluate((el) => getComputedStyle(el).display)).toBe("none");
    const focusable = await page.evaluate(() => {
      const el = document.getElementById("collapsible0");
      el.focus();
      return document.activeElement === el;
    });
    expect(focusable).toBe(false);
  });
});
