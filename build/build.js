const fs = require('fs');
const sass = require('sass');
const write = require('write');
const rimraf = require('rimraf');
const postcss = require('postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');

const constants = require('./constants');
const log = require('./log');

async function build() {
  log('Starting PaperCSS build...');
  log('Cleaning "dist/, docs/static/assets/paper.css" folder...');

  rimraf.sync('dist', { disableGlob: true });

  if (fs.existsSync(constants.PAPER_DOCS_PATH)) {
    fs.unlinkSync(constants.PAPER_DOCS_PATH);
  }

  log('Compiling SCSS to CSS, entrypoint:', constants.ENTRYPOINT_PATH);

  // `sass.compile` is the modern API. `sass.renderSync` was the legacy JS API,
  // which Dart Sass deprecated and removes in 2.0.0 -- so upgrading the
  // compiler without changing this call would have left the build one major
  // release from breaking.
  const compiledCSS = sass.compile(constants.ENTRYPOINT_PATH);

  log('Processing CSS: autoprefixer...');

  const autoprefixedCSS = await postcss([autoprefixer]).process(compiledCSS.css, { from: undefined });

  log('Processing CSS: cssnano...');

  const minifiedCSS = await postcss([cssnano]).process(autoprefixedCSS.css, { from: undefined });

  log('Writing paper.css and paper.min.css files to dist/ and docs/ folders...');

  write(constants.PAPER_DIST_PATH, autoprefixedCSS.css);
  write(constants.PAPER_DIST_MIN_PATH, minifiedCSS.css);
  write(constants.PAPER_DOCS_PATH, autoprefixedCSS.css);

  log('Build done!');
}

build();
