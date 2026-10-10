import { defineConfig } from "@playwright/test";

// Browser gate for the component contract. These tests exercise the built
// stylesheet in Playwright's own headless Chromium, so they run the same in a
// devcontainer and on a developer's machine without touching a system browser
// profile. They are not part of `make check`'s CSS gates by accident: the
// collapsible's keyboard operability and height behaviour are only observable
// in a layout engine.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  use: {
    browserName: "chromium",
    headless: true,
    trace: "on-first-retry",
  },
});
