/*
 * Light/dark toggle for the documentation site.
 *
 * The framework's dark mode is activated by a `.dark` class on the root
 * element, and its contract is a single class with no per-component dark
 * styling. This is the control that lets a reader switch it live while
 * browsing, rather than only seeing it on the Dark Mode page — which is why it
 * lives in the site header and is present on every page.
 *
 * It is deliberately tiny and dependency-free. It reads and writes one class on
 * <html>, and it reports its state through `aria-pressed` rather than through
 * its label, so a screen reader announces the mode rather than relying on the
 * reader to infer it from the button's appearance.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'papercss-docs-theme';
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');

  if (!toggle) return;

  function isDark() {
    return root.classList.contains('dark');
  }

  function stored() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      // Private mode, or storage disabled. The toggle still works for this
      // page; it just will not be remembered.
      return null;
    }
  }

  function store(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      /* nothing to do */
    }
  }

  function render() {
    toggle.setAttribute('aria-pressed', isDark() ? 'true' : 'false');
  }

  // Restore the previous choice. Applied before the first paint where possible
  // so the page does not flash the other theme.
  if (stored() === 'dark') root.classList.add('dark');
  render();

  toggle.addEventListener('click', function () {
    root.classList.toggle('dark');
    store(isDark() ? 'dark' : 'light');
    render();
  });
})();
