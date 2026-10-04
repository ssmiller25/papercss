# Spec Delta

## Purpose

Defines the gates that decide whether this repository may ship a stylesheet and a documentation site, so that a defect in a build artifact is caught by a command rather than by a downstream consumer.

## ADDED Requirements

### Requirement: Gates run on shipped artifacts

The repository SHALL gate the artifacts consumers actually consume — the generated stylesheet and the generated documentation — and not only the sources those artifacts are built from.

#### Scenario: A declaration value is not real

- **WHEN** a source declaration carries a value the corresponding property does not accept
- **THEN** verification fails
- **AND** the failure names the property and the offending value

#### Scenario: A defect exists only after compilation

- **WHEN** a stylesheet is well-formed SCSS but the compiled output is invalid CSS
- **THEN** verification fails on the compiled output

### Requirement: Generated output is held to correctness, not to authoring style

Gates on generated output SHALL enforce correctness rules and SHALL NOT enforce the authoring rules applied to hand-written source. Formatting of generated output is the generator's responsibility.

#### Scenario: A generated stylesheet is checked

- **WHEN** verification inspects a generated stylesheet
- **THEN** unknown properties, at-rules, functions, units, and declaration values are checked
- **AND** whitespace, ordering, and notation preferences are not

#### Scenario: A generated rule repeats a property deliberately

- **WHEN** a generated rule emits a literal declaration followed by a custom-property fallback for the same property
- **THEN** verification does not report it as a duplicate
- **AND** the reason it is not reported is recorded in the committed configuration

### Requirement: The tracked distribution is reproducible from source

The generated stylesheet SHALL be reproducible from source by the committed build, and the repository SHALL contain no generated stylesheet that the build does not reproduce.

#### Scenario: The build is run twice

- **WHEN** the build runs twice with no source change between runs
- **THEN** the two outputs are byte-identical

#### Scenario: The distribution was edited by hand

- **WHEN** the tracked distribution differs from what the build produces
- **THEN** verification fails

#### Scenario: Source changed without rebuilding

- **WHEN** a source change is not reflected in the tracked distribution
- **THEN** verification fails

### Requirement: Tool versions are fixed by the repository

Every tool a gate invokes SHALL run at a version the repository fixes. A gate SHALL NOT depend on a tool resolving to whatever version a registry currently serves.

#### Scenario: The environment is provisioned

- **WHEN** the verification environment is created
- **THEN** each tool is installed at the version the repository specifies

#### Scenario: A tool cannot be installed as a dependency

- **WHEN** a required tool cannot be installed reliably through the package manager
- **THEN** it is provided by the environment definition at a pinned version instead

### Requirement: Regression baseline for the documentation

The repository SHALL record the current validation result for the built documentation, and gates SHALL fail on any increase from that recorded result. The recorded result SHALL carry a ceiling per rule, not only an aggregate total.

Lowering a recorded ceiling SHALL be a deliberate act. A passing run SHALL NOT raise or lower a ceiling on its own.

#### Scenario: A change introduces new violations

- **WHEN** a change increases the count of violations for any rule
- **THEN** verification fails and names the rule and both counts

#### Scenario: Violations appear under a rule with no recorded ceiling

- **WHEN** a change produces the first violation of a rule the baseline has never seen
- **THEN** verification fails

#### Scenario: One rule improves while another regresses

- **WHEN** a change reduces the violations of one rule and increases those of another by the same amount
- **THEN** verification fails on the regressed rule

#### Scenario: The baseline is improved

- **WHEN** a deliberate cleanup reduces the count
- **THEN** the recorded baseline is tightened to the new count in the same change

### Requirement: Documentation validation separates copied examples from page chrome

The documentation gate SHALL distinguish the markup a reader is meant to copy from the surrounding page template, and SHALL enforce a separate recorded ceiling for each region. The two regions SHALL be disjoint, so a violation belongs to exactly one of them.

#### Scenario: A documented example is invalid

- **WHEN** a live demo's markup violates a rule
- **THEN** the demo region fails
- **AND** the page-chrome region's result is unaffected

#### Scenario: A template fix masks an invalid example

- **WHEN** the page-chrome count falls for an unrelated reason
- **THEN** a violation inside a demo still fails

#### Scenario: A demo stops being validated

- **WHEN** the set of recognised demo regions changes
- **THEN** that is reported as a structural change requiring review
- **AND** a reduction in the region count does not pass as an improvement

#### Scenario: A demo is emitted but not identifiable

- **WHEN** the mechanism that marks demo markup cannot distinguish it from page chrome
- **THEN** the regions are not treated as correctly separated
- **AND** a single combined ceiling is not accepted as equivalent

### Requirement: The documentation build runs on a supported toolchain

The documentation SHALL build with a currently supported version of its generator, and SHALL NOT be pinned to an obsolete major version by a single configuration value.

#### Scenario: The documentation is built with a current generator

- **WHEN** the documentation is built with a supported version
- **THEN** the build succeeds
- **AND** every page the previous version produced is still produced

#### Scenario: A retired component is configured

- **WHEN** the configuration names a generator component that has been removed upstream
- **THEN** the configuration does not name it

### Requirement: A single local entry point

The repository SHALL provide one documented command that runs the full verification sequence, and continuous integration SHALL invoke that same command.

#### Scenario: A contributor verifies locally

- **WHEN** a contributor runs the documented command
- **THEN** the full gate sequence executes
- **AND** the command is listed in the task runner's own help output

#### Scenario: The local command and CI are compared

- **WHEN** the local command and the continuous integration definition are compared
- **THEN** they invoke the same gates

### Requirement: A committed gate is runnable

A gate definition committed to the repository SHALL execute. A gate that aborts during setup, or that a preceding failure prevents from being reached, SHALL be treated as a defect in its own right rather than as an absent or passing check.

#### Scenario: A gate names an option its tool does not have

- **WHEN** a gate definition requests analysis in a language, format, or rule the invoked tool does not support
- **THEN** the definition is corrected rather than left to fail on every run

#### Scenario: A gate is not reached

- **WHEN** one step of a gate sequence fails
- **THEN** the following steps are treated as unverified rather than as passing

### Requirement: The build and the gates run on one maintained toolchain

Every tool the build and the gates invoke SHALL be a version the project still maintains. The gates SHALL run through the project's own installed dependencies rather than through a tool resolved from elsewhere in the environment.

#### Scenario: A gate needs a rule the installed linter lacks

- **WHEN** a correctness rule is unavailable in the installed linter
- **THEN** the linter is replaced rather than the rule being worked around with a second tool from outside the project

#### Scenario: A second tool is introduced to compensate

- **WHEN** a gate can only be satisfied by a tool the project does not declare
- **THEN** that arrangement is treated as a defect in the toolchain rather than as a working setup

#### Scenario: A tool is past end-of-life

- **WHEN** a tool the build depends on no longer receives maintenance
- **THEN** it is replaced, and a gate that depends on it is not left resolving to whatever a registry currently serves

### Requirement: Recorded output equivalence compares resolved values

Where a build change is verified against a recorded baseline, the comparison SHALL include declaration values, not only property names. A comparison that would pass a wholesale change in resolved values SHALL be treated as a defective check.

#### Scenario: A toolchain replacement changes a resolved value

- **WHEN** a tool replacement resolves a declaration to a different value
- **THEN** the equivalence check fails
- **AND** the failure names the selector and the property whose value moved

#### Scenario: Generated output differs only in formatting

- **WHEN** a tool replacement changes whitespace, ordering, prefixing, or minification but resolves every selector to the same declarations
- **THEN** the change passes equivalence
- **AND** the one-time difference is recorded rather than silently accepted

#### Scenario: Only property names are compared

- **WHEN** an equivalence check compares property names but not their values
- **THEN** the check is defective, because a complete palette rewrite would satisfy it

### Requirement: The shipped theme is verified for completeness, not merely for presence

The gates SHALL verify that every custom property the default theme declares is also declared by the alternate theme, and that the rule activating the alternate theme is present in the built stylesheet. Presence of a theme's selector SHALL NOT be accepted as evidence that the theme is complete.

#### Scenario: The alternate theme omits a property

- **WHEN** the alternate theme declares fewer custom properties than the default theme
- **THEN** verification fails and names the missing property

#### Scenario: The theme rule is dropped

- **WHEN** the built stylesheet no longer contains the rule that activates the alternate theme
- **THEN** verification fails

#### Scenario: A component resolves a value from the wrong theme

- **WHEN** a component's custom property is absent from the active theme
- **THEN** the component renders with a default-theme value
- **AND** this is a failure of the theme gate rather than a rendering detail to be noted in review