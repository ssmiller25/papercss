const fs = require('fs');
const path = require('path');
const sass = require('sass');
const write = require('write');
const rimraf = require('rimraf');
const postcss = require('postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');
const colormin = require('postcss-colormin');

const constants = require('./constants');
const log = require('./log');

// The bundled typefaces are committed inputs, not generated: the build only
// reproduces them beside the stylesheet, so a relative `url('fonts/...')` in
// the CSS resolves from a CDN, the documentation site, or an extracted release
// download alike. `OFL.txt` rides along so the fonts' licence travels with them.
function copyFonts() {
  fs.mkdirSync(constants.FONT_DIST_DIR, { recursive: true });
  fs.mkdirSync(constants.FONT_DOCS_DIR, { recursive: true });

  for (const name of fs.readdirSync(constants.FONT_SRC_DIR)) {
    const from = path.join(constants.FONT_SRC_DIR, name);
    if (!fs.statSync(from).isFile()) continue;

    fs.copyFileSync(from, path.join(constants.FONT_DIST_DIR, name));
    fs.copyFileSync(from, path.join(constants.FONT_DOCS_DIR, name));
  }
}

async function build() {
  log('Starting PaperCSS build...');
  log('Cleaning "dist/, docs/static/assets/paper.css" folder...');

  rimraf.sync('dist', { disableGlob: true });

  if (fs.existsSync(constants.PAPER_DOCS_PATH)) {
    fs.unlinkSync(constants.PAPER_DOCS_PATH);
  }

  // Remove the copied fonts too, so a file dropped from src/fonts/ cannot linger
  // in the documentation assets after a build.
  rimraf.sync(constants.FONT_DOCS_DIR, { disableGlob: true });

  log('Compiling SCSS to CSS, entrypoint:', constants.ENTRYPOINT_PATH);

  // `sass.compile` is the modern API. `sass.renderSync` was the legacy JS API,
  // which Dart Sass deprecated and removes in 2.0.0 -- so upgrading the
  // compiler without changing this call would have left the build one major
  // release from breaking.
  const compiledCSS = sass.compile(constants.ENTRYPOINT_PATH);

  // Colour normalisation is applied to the *unminified* output as well as the
  // minified, and deliberately.
  //
  // Dart Sass 1.79+ stopped rounding colour channels to 8-bit. Where
  // `lighten()` used to emit `#cdcccb` it now emits
  // `rgb(80.3767176162%, 80.0602130616%, 79.4272039524%)` -- the same colour,
  // but ~50 characters instead of 7. cssnano already normalises that in
  // paper.min.css; nothing did for paper.css, which is the readable artifact.
  // The result was a 7.1% larger stylesheet and a far harder one to read or
  // diff. `postcss-colormin` is the plugin cssnano uses internally, so running
  // it here makes the two artifacts agree on notation.
  //
  // These plugins are called rather than passed. PostCSS 8 accepts a plugin
  // factory, but each of these exports a function that *returns* the plugin,
  // so passing the function itself is a subtle way to get a silent no-op.
  log('Processing CSS: autoprefixer, colormin...');

  const autoprefixedCSS = await postcss([autoprefixer(), colormin()]).process(compiledCSS.css, {
    from: undefined,
  });

  log('Processing CSS: cssnano...');

  const minifiedCSS = await postcss([cssnano()]).process(autoprefixedCSS.css, { from: undefined });

  log('Writing paper.css and paper.min.css files to dist/ and docs/ folders...');

  write(constants.PAPER_DIST_PATH, autoprefixedCSS.css);
  write(constants.PAPER_DIST_MIN_PATH, minifiedCSS.css);
  write(constants.PAPER_DOCS_PATH, autoprefixedCSS.css);

  log('Copying fonts to dist/ and docs/ folders...');

  copyFonts();

  log('Build done!');
}

build();
