#!/usr/bin/env node
/*
 * Record the resolved declarations of the built stylesheet.
 *
 * Run through `make check`, or directly:
 *
 *     node scripts/record-css-declarations.mjs          record
 *     node scripts/record-css-declarations.mjs --check  verify against the record
 *
 * Why this exists
 * ---------------
 * Replacing the build toolchain (openspec task group 4) changes the tools
 * that generate dist/paper.css, and those tools do not agree on formatting:
 * autoprefixer and cssnano decide whitespace, vendor prefixes, minification
 * and declaration order. The output is therefore *expected* to differ
 * byte-for-byte after the upgrade, which means "did the upgrade change what
 * the stylesheet does?" cannot be answered by diffing the file.
 *
 * What it has to answer instead is narrower and more useful: for every rule
 * in the output, which declarations does it resolve to, and to what values.
 * That is what this records, and what the comparison in `make check` asserts.
 *
 * Values are recorded, not just property names
 * --------------------------------------------
 * A record of property names alone would be worthless for the purpose it
 * exists to serve. The framework's whole theming mechanism is custom
 * properties resolved at runtime, so a toolchain change that silently
 * altered every colour in the palette would produce an identical list of
 * property names and pass any name-only comparison. The dark theme is the
 * specific case this protects: one `html.dark` block, every component
 * reading it through `var()`, and no gate anywhere that would notice a
 * missing or altered value.
 *
 * Therefore the comparison is on (property, value) pairs, and `--values` is
 * not an option.
 *
 * What is deliberately not recorded
 * ---------------------------------
 *   Formatting    Whitespace, indentation and declaration order within a rule
 *                 are the generator's business. Values are whitespace-
 *                 collapsed, so `rgba(0, 0, 0, 0.7)` and `rgba(0,0,0,0.7)`
 *                 are reported as different -- correctly, since that is a
 *                 real change in output rather than a formatting one.
 *   Source order  Rules are recorded in the order they appear, because order
 *                 is load-bearing in CSS. A toolchain that reorders rules
 *                 changes behaviour even when every declaration matches, and
 *                 this catches that.
 *   Comments      Stripped. Generated CSS carries no comment worth diffing,
 *                 and a comment change is not a behaviour change.
 *
 * This script does not decide whether a change is acceptable. It records and,
 * with `--check`, reports differences. Whether a given difference is intended
 * is a judgement call, and is recorded as such in CHANGELOG.md rather than
 * being silently accepted here.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DEFAULT_SOURCE = 'dist/paper.css';
const DEFAULT_RECORD = '.css-declarations.json';

const args = process.argv.slice(2);
const check = args.includes('--check');
const quiet = args.includes('--quiet');

function argValue(flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const sourcePath = argValue('--source', DEFAULT_SOURCE);
const recordPath = argValue('--out', DEFAULT_RECORD);

/*
 * Split a stylesheet into rules and their declarations.
 *
 * A line-based reader is the right tool here and a CSS parser would be the
 * wrong one. This file is *generated* output: postcss has already resolved
 * it, so there is no nesting to track beyond at-rule blocks, no interpolation
 * left, and no syntax a general parser would handle better. What the reader
 * must not do is fail quietly, so anything it cannot classify is collected
 * into `unparsed` and reported, rather than skipped.
 */
function parse(css) {
  /*
   * Blank comments rather than deleting them. A multi-line comment removal
   * shifts every subsequent line number, and this script reports line numbers
   * when it cannot classify something -- so preserving the line count is what
   * makes those reports point at the right place.
   */
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

  const rules = [];
  const statements = [];
  const unparsed = [];

  // Stack of open blocks. A line ending in `{` always opens one, at any depth.
  const stack = [];

  // Prelude lines seen so far that have not yet been closed by `{`. Selectors
  // in this stylesheet wrap across lines -- `article,\naside,\nfooter {` --
  // so a rule's identity is only known once the brace arrives. Buffering is
  // the difference between recording `article, aside, footer` and recording
  // just `footer`, which is the kind of silent truncation that would let a
  // real change pass unnoticed.
  let pending = [];

  /*
   * A nested rule's identity includes the at-rules it sits inside.
   *
   * This is not cosmetic. The same selector appears under several @media
   * conditions -- `nav .collapsible-body` alone is not a key, because it
   * resolves differently at 480px than at 992px. Recording the selector
   * without its condition and keying the comparison on it would collapse
   * those into one entry, and a change inside a single media block would then
   * be masked by the others. Each rule is therefore keyed by its full path
   * through the at-rule chain, so a change in one breakpoint cannot hide
   * behind a sibling.
   */
  const fullPath = (prelude) =>
    [...stack.map((s) => s.prelude), prelude].join(' ').replace(/\s+/g, ' ').trim();

  const lines = stripped.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line === '}') {
      if (!stack.length) {
        unparsed.push({ line: i + 1, text: line, why: 'unbalanced close' });
      } else {
        stack.pop();
      }
      continue;
    }

    if (line.endsWith('{')) {
      const prelude = [...pending, line.slice(0, -1)].join(' ').replace(/\s+/g, ' ').trim();
      pending = [];
      // Resolve the path from the enclosing blocks *before* pushing this one.
      // Computing it afterwards includes the rule in its own path, producing
      // selectors like `nav ul nav ul` -- which corrupts the comparison key
      // silently rather than failing.
      const selector = fullPath(prelude);
      stack.push({ prelude, declarations: [] });
      rules.push({
        selector,
        line: i + 1,
        declarations: stack[stack.length - 1].declarations,
      });
      continue;
    }

    if (!line.endsWith(';')) {
      // Neither terminator nor brace, so this line continues a prelude.
      // Selectors wrap across lines in this stylesheet, including inside
      // @media blocks, and a wrapped selector line can itself contain colons
      // (`::before`, `[type=radio]`) -- so a `:` cannot distinguish a selector
      // from a declaration. The `;` terminator is the only reliable signal,
      // and postcss emits it on every declaration.
      pending.push(line);
      continue;
    }

    const body = line.slice(0, -1);

    if (!stack.length) {
      // Top level and terminated: @charset or @import. Recorded because
      // removing the Google Fonts @import is planned (openspec group 15).
      statements.push({ prelude: body.replace(/\s+/g, ' ').trim() });
      continue;
    }

    const sep = body.indexOf(':');
    if (sep === -1) {
      unparsed.push({ line: i + 1, text: line, why: 'no property separator' });
      continue;
    }
    const property = body.slice(0, sep).trim();
    const value = body.slice(sep + 1).trim().replace(/\s+/g, ' ');
    if (!property || !value) {
      unparsed.push({ line: i + 1, text: line, why: 'empty property or value' });
      continue;
    }
    stack[stack.length - 1].declarations.push({ property, value });
  }

  if (stack.length) {
    unparsed.push({
      line: lines.length,
      text: '<eof>',
      why: `${stack.length} unclosed block(s)`,
    });
  }
  if (pending.length) {
    unparsed.push({
      line: lines.length,
      text: pending.join(' ').slice(0, 80),
      why: 'selector never closed by a brace',
    });
  }

  return { rules, statements, unparsed };
}

function serialise(rules) {
  /*
   * Key on (selector, occurrence), not selector alone.
   *
   * Duplicates are real in this stylesheet rather than a parsing artefact --
   * `html` appears four times, `a` twice, because the reset and the component
   * layers each style them. Keying on selector alone would collapse those into
   * a single entry, keeping only the last, so a change to the first `html` rule
   * would be invisible to the comparison. The occurrence suffix keeps them
   * distinct, and comparing the key *sequence* as well as the declarations is
   * what catches a toolchain reordering rules.
   */
  const seen = new Map();
  return rules
    .filter((rule) => rule.declarations.length > 0)
    .map((rule) => {
      const n = (seen.get(rule.selector) || 0) + 1;
      seen.set(rule.selector, n);
      return {
        key: `${rule.selector} #${n}`,
        selector: rule.selector,
        declarations: rule.declarations,
      };
    });
}

const css = readFileSync(sourcePath, 'utf8');
const { rules, statements, unparsed } = parse(css);
const serialised = serialise(rules);

const declarationCount = serialised.reduce((n, r) => n + r.declarations.length, 0);
const digest = createHash('sha256')
  .update(JSON.stringify({ statements, rules: serialised }))
  .digest('hex');

const record = {
  $comment:
    'Generated by scripts/record-css-declarations.mjs. The resolved (property, value) pairs of every rule in dist/paper.css, in output order, plus the top-level at-statements. Regenerate with `make check-declarations-update` after an intended change; never edit by hand. Values are included deliberately -- a name-only record would pass a wholesale palette rewrite.',
  source: sourcePath,
  digest,
  statementCount: statements.length,
  ruleCount: serialised.length,
  declarationCount,
  statements: statements.map((s) => s.prelude),
  rules: serialised,
};

const json = `${JSON.stringify(record, null, 2)}\n`;

if (unparsed.length && !quiet) {
  process.stderr.write(
    `warning: ${unparsed.length} line(s) could not be classified and are NOT in the record:\n`
  );
  for (const u of unparsed.slice(0, 10)) {
    process.stderr.write(`  ${sourcePath}:${u.line}  ${u.why}: ${u.text.slice(0, 80)}\n`);
  }
  if (unparsed.length > 10) {
    process.stderr.write(`  ... and ${unparsed.length - 10} more\n`);
  }
  process.stderr.write(
    'warning: an incomplete record would make the comparison pass while ignoring real output.\n'
  );
}

if (check) {
  const previous = JSON.parse(readFileSync(recordPath, 'utf8'));

  const beforeByKey = new Map(previous.rules.map((r) => [r.key, r.declarations]));
  const afterByKey = new Map(serialised.map((r) => [r.key, r.declarations]));

  const added = [...afterByKey.keys()].filter((k) => !beforeByKey.has(k));
  const removed = [...beforeByKey.keys()].filter((k) => !afterByKey.has(k));
  const changed = [];

  for (const [key, decls] of afterByKey) {
    if (!beforeByKey.has(key)) continue;
    const prev = beforeByKey.get(key);
    if (JSON.stringify(prev) === JSON.stringify(decls)) continue;

    const prevMap = new Map(prev.map((d) => [d.property, d.value]));
    const afterProps = new Set(decls.map((d) => d.property));

    for (const d of decls) {
      if (!prevMap.has(d.property)) {
        changed.push({ key, property: d.property, from: null, to: d.value });
      } else if (prevMap.get(d.property) !== d.value) {
        changed.push({ key, property: d.property, from: prevMap.get(d.property), to: d.value });
      }
    }
    for (const d of prev) {
      if (!afterProps.has(d.property)) {
        changed.push({ key, property: d.property, from: d.value, to: null });
      }
    }
  }

  // Order is load-bearing in CSS: the same rules in a different order cascade
  // differently. Comparing the key sequences catches a toolchain reordering
  // even when every declaration matches, which a per-key diff cannot see.
  const beforeOrder = previous.rules.map((r) => r.key);
  const afterOrder = serialised.map((r) => r.key);
  const reordered =
    beforeOrder.length === afterOrder.length &&
    beforeOrder.some((k, i) => k !== afterOrder[i]);

  const beforeStatements = previous.statements || [];
  const statementDiff =
    JSON.stringify(beforeStatements) === JSON.stringify(record.statements)
      ? []
      : [{ from: beforeStatements.join(' | ') || '(none)', to: record.statements.join(' | ') || '(none)' }];

  const total = added.length + removed.length + changed.length + statementDiff.length + (reordered ? 1 : 0);

  if (!quiet) {
    process.stdout.write(
      `declaration set: ${total} difference(s)\n` +
        `  ${added.length} rule(s) added, ${removed.length} removed, ` +
        `${changed.length} declaration(s) changed, ${statementDiff.length} top-level statement(s) changed` +
        `${reordered ? ', rules reordered' : ''}\n`
    );
    for (const c of changed.slice(0, 20)) {
      process.stdout.write(`  ${c.key} { ${c.property} }: ${c.from} -> ${c.to}\n`);
    }
    if (changed.length > 20) process.stdout.write(`  ... and ${changed.length - 20} more\n`);
    for (const a of added.slice(0, 10)) process.stdout.write(`  + ${a}\n`);
    for (const r of removed.slice(0, 10)) process.stdout.write(`  - ${r}\n`);
    for (const s of statementDiff) {
      process.stdout.write(`  top-level statement: ${s.from}\n                    -> ${s.to}\n`);
    }
    if (reordered) {
      process.stdout.write('  rules are in a different order than recorded (cascade order changed)\n');
    }
  }

  if (total > 0) {
    process.stderr.write(
      '\nThe built stylesheet resolves differently from the recorded set.\n' +
        'If the change is intended, regenerate the record with\n' +
        '    make check-declarations-update\n' +
        'and record the difference in CHANGELOG.md.\n'
    );
    process.exit(1);
  }
  process.exit(0);
}

writeFileSync(recordPath, json);
if (!quiet) {
  process.stdout.write(
    `recorded ${record.ruleCount} rule(s), ${record.declarationCount} declaration(s) -> ${recordPath}\n` +
      `sha256 ${digest}\n`
  );
}