#!/usr/bin/env node
/*
 * Verify the framework's configuration contract: a consumer can override a
 * theme value by assigning it before importing, and `!default` honours it.
 *
 * Run through `make check`, or directly:
 *
 *     node scripts/check-config-override.mjs
 *
 * Why this exists
 * ---------------
 * This is the public API for anyone who builds PaperCSS from source rather
 * than consuming the prebuilt stylesheet, and it is easy to break without
 * noticing. `_config.scss` carries 109 `!default` declarations precisely so
 * that assigning before the import wins; that mechanism only works while the
 * sources are wired together with `@import`. Converting even one partial to
 * the Sass module system in isolation would silently stop honouring an
 * override, and nothing else in this repository would fail.
 *
 * Dart Sass removes `@import` in 3.0.0, so that conversion is coming. This
 * check is what makes it a deliberate, visible break with a migration rather
 * than an accident discovered by a consumer whose colours stopped applying.
 *
 * Two assertions, and both are needed:
 *
 *   override   the sentinel assigned before the import must appear as
 *              `--primary` in the compiled output. This is the contract.
 *   control    without the assignment, the default must appear. Without this
 *              the check could pass for the wrong reason -- for instance if
 *              the output stopped containing `--primary` at all, the override
 *              assertion would fail but a careless rewrite could invert it.
 *
 * A third block checks the font-delivery contract the same way: the default
 * emits the bundled @font-face rules, `$font-src: false` emits none, and a URL
 * value is imported as an alternative source. All three use `!default`, so a
 * regression in one is the same class of defect as a broken colour override.
 *
 * The check compiles its own fixture rather than reading dist/paper.css,
 * because the point is to exercise the *consumer's* path, which the shipped
 * stylesheet does not represent.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as sass from 'sass';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src');

// A colour that appears nowhere in the framework, so its presence in the
// output can only come from the fixture.
const SENTINEL = '#ff00ff';
const DEFAULT_PRIMARY = '#41403e';

const silent = { logger: sass.Logger.silent };

function compile(assignment) {
  const source = `${assignment}@import 'styles';\n`;
  return sass.compileString(source, { loadPaths: [srcDir], ...silent }).css;
}

function primaryOf(css) {
  const match = css.match(/--primary:\s*([^;]+);/);
  if (!match) return null;
  return match[1].trim().toLowerCase();
}

function fail(lines) {
  process.stderr.write(`${lines.join('\n')}\n`);
  process.exit(1);
}

// 1. The contract: an assignment before the import is honoured.
const overridden = primaryOf(compile(`$primary: ${SENTINEL};\n`));

if (overridden === null) {
  fail([
    'error: the compiled fixture declares no --primary at all.',
    '       The configuration contract cannot be checked against output that',
    '       does not contain the value it configures.',
  ]);
}

if (overridden !== SENTINEL) {
  fail([
    `error: assigning $primary before the import had no effect.`,
    `       expected --primary: ${SENTINEL}`,
    `       actual   --primary: ${overridden}`,
    '',
    '       This means the `!default` configuration mechanism no longer honours',
    '       a value set before the import. The usual cause is a partial being',
    '       converted from `@import` to the Sass module system, which changes',
    '       how a consumer configures the framework. If that change is',
    '       intended, it is breaking and needs a migration in UPGRADE.md.',
  ]);
}

// 2. The control: without the assignment, the default must appear. This proves
//    the fixture above is actually exercising the mechanism.
const builtin = primaryOf(compile(''));

if (builtin !== DEFAULT_PRIMARY) {
  fail([
    `error: the default --primary is no longer ${DEFAULT_PRIMARY}.`,
    `       actual --primary: ${builtin}`,
    '',
    '       Either the palette default changed, in which case update this',
    '       check and record the change, or the fixture is no longer reading',
    '       the value this check is about.',
  ]);
}

// 3. The font-delivery contract: the default build emits the framework's own
//    @font-face rules, `false` emits none, and any other value is imported as
//    an alternative source. All three ride on the same `!default` mechanism as
//    the palette, so they are checked here beside it.
const DEFAULT_FONT_URL = 'fonts/neucha-latin.woff2';
const defaultCss = compile('');

if (!/@font-face\s*\{/.test(defaultCss)) {
  fail([
    'error: the default build emits no @font-face, so a drop-in consumer does',
    "       not get the framework's typefaces.",
    '',
    '       Either the bundled font default was removed, in which case restore',
    '       it or record the change, or the fixture no longer reads $font-src.',
  ]);
}

if (!defaultCss.includes(DEFAULT_FONT_URL)) {
  fail([
    'error: the default build does not reference the bundled font files.',
    `       expected a url containing ${DEFAULT_FONT_URL}`,
    '',
    '       The default should resolve $font-src to the files shipped beside',
    '       the stylesheet, not to a remote source.',
  ]);
}

const disabledCss = compile('$font-src: false;\n');

if (/@font-face\s*\{/.test(disabledCss) || disabledCss.includes(DEFAULT_FONT_URL)) {
  fail([
    'error: $font-src: false still emits font files.',
    '',
    '       A consumer who disables the fonts must get a stylesheet that',
    '       references no typeface file, so the stack falls back.',
  ]);
}

const ALT_FONT_SRC = 'https://example.invalid/fonts.css';
const redirectedCss = compile(`$font-src: '${ALT_FONT_SRC}';\n`);

if (!redirectedCss.includes(ALT_FONT_SRC) || !/@import url\(/.test(redirectedCss)) {
  fail([
    'error: assigning $font-src to a URL no longer imports it.',
    `       expected an @import url(...) naming ${ALT_FONT_SRC}`,
    '',
    '       The alternative-source path must keep working, so a consumer can',
    '       redirect the fonts without editing the framework.',
  ]);
}

if (redirectedCss.includes(DEFAULT_FONT_URL)) {
  fail([
    'error: a consumer-supplied $font-src URL still emits the bundled files.',
    '',
    '       The redirect must replace the bundled fonts, not add to them.',
  ]);
}

process.stdout.write(
  `configuration contract holds: ${SENTINEL} assigned before the import wins, ` +
    `${DEFAULT_PRIMARY} is the default when it is not, and the font default ` +
    `emits the bundled files while false disables them and a URL redirects\n`
);
