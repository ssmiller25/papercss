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

    // The one finding this ruleset produced on its first run, and it is a false
    // positive worth keeping a record of.
    //
    // `_reset.scss` sets `-webkit-text-decoration-skip: objects`. `objects` is
    // not a typo. It was a value of `text-decoration-skip` in CSS Text
    // Decoration Level 3 (`none | objects | spaces | ink | edges |
    // box-decoration`) and is still the initial value of
    // `text-decoration-skip-self` in Level 4. Level 4 narrowed the unprefixed
    // property to `none | auto`, and the rule validates against the current
    // definition, so it rejects a declaration the prefixed property accepts.
    //
    // Correcting the value set rather than muting the property is deliberate:
    // the property is still checked, and a genuinely unknown value on it would
    // still be caught.
    //
    // Note: stylelint deprecates `propertiesSyntax` in favour of
    // `languageOptions`, but this rule rejects `languageOptions` as an invalid
    // option name in both 16.26.1 and 17.16.0, and its `ignoreProperties`
    // option is likewise rejected in both. The deprecation warning this emits
    // on every run is therefore expected and unavoidable; it points at an
    // alternative the rule does not actually accept.
    'declaration-property-value-no-unknown': [
      true,
      {
        propertiesSyntax: {
          'text-decoration-skip':
            'none | auto | objects | spaces | ink | edges | box-decoration',
        },
      },
    ],
  },
};