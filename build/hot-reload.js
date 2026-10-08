const sass = require('sass');
const write = require('write');
const postcss = require('postcss');
const chokidar = require('chokidar');
const autoprefixer = require('autoprefixer');

const constants = require('./constants');
const log = require('./log');

// `sass.compileAsync` replaces `util.promisify(sass.render)`: the legacy JS API
// is deprecated and removed in Dart Sass 2.0.0. It already returns a Promise,
// so wrapping it in `promisify` is both unnecessary and a Node deprecation
// (DEP0174).
function compile() {
  sass
    .compileAsync(constants.ENTRYPOINT_PATH)
    .then((compiledCSS) => postcss([autoprefixer()]).process(compiledCSS.css, { from: undefined }))
    .then((autoprefixedCSS) => write(constants.PAPER_DOCS_PATH, autoprefixedCSS.css))
    .then(() => log('Compiled CSS in docs/ folder.'));
}

chokidar.watch('./src/**/*.scss').on('change', (event) => {
  log(`Detected file change (${event}), compiling SCSS to CSS...`);
  compile();
});

// Do initial compilation.
compile();
