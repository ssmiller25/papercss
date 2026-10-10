/*
 * Correctness ruleset for the *generated* stylesheet.
 *
 * This is deliberately not the config used for the hand-written SCSS
 * (.stylelintrc.json). dist/paper.css is produced by sass, autoprefixer, and
 * cssnano, and its formatting is those tools' business: holding it to the
 * authoring ruleset produces ~640 complaints - 359 about empty lines, 80 about
 * number precision - and not one of them is a defect. Generated output is held
 * to correctness only.
 *
 * Every exclusion below is a false positive with a reason, recorded here
 * rather than left as a silent gap in coverage.
 */
module.exports = {
  rules: {
    'at-rule-no-unknown': true,
    'function-no-unknown': true,
    'property-no-unknown': true,
    'unit-no-unknown': true,

    // Not enforced. PaperCSS's `color()` mixin emits a literal fallback
    // followed by the custom property for the same property:
    //
    //   .text-primary { color: #41403e; color: var(--primary); }
    //
    // That is deliberate progressive enhancement - the literal for browsers
    // without custom properties, the variable for those with them - and the
    // rule reports all ~180 of them. The alternative to switching it off is
    // deleting the framework's theming mechanism.
    'declaration-block-no-duplicate-properties': null,

    // The first run of this ruleset produced exactly one finding, and it was a
    // false positive: `_reset.scss` set `-webkit-text-decoration-skip: objects`,
    // a Level 3 value the rule rejected because it validates against Level 4,
    // where the unprefixed property was narrowed to `none | auto`. It was
    // muted with a `propertiesSyntax` override that kept the property checked.
    //
    // That override has since been removed, because the declaration it existed
    // to excuse was itself dropped as obsolete (openspec task 3.3). The rule
    // now runs unmodified. Nothing here should be re-added to silence this
    // property again - if it ever returns, it should return without a value
    // the current specification rejects.
    'declaration-property-value-no-unknown': true,
  },
};