# component-contract Specification

## Purpose
Defines what the collapsible and navbar components guarantee to the people using them. A CSS framework's component contract is invisible until it is broken, and every defect recorded here broke it silently: content was clipped, a control could not be reached, and documented markup was invalid — none of which raised an error at build time.

## Requirements

### Requirement: The identifier contract is honored

Every collapsible rule SHALL be conditioned on the identifier shape the framework documents, and that shape SHALL remain stable across releases. The framework SHALL document the shape explicitly rather than leaving consumers to infer it from selectors.

#### Scenario: A consumer implements a collapsible

- **WHEN** a consumer marks up a collapsible using the documented structure
- **THEN** the framework's own rules apply to it with no additional selectors

#### Scenario: A consumer inspects the stylesheet

- **WHEN** a consumer needs to know what makes a collapsible a collapsible
- **THEN** the identifier requirement is documented

#### Scenario: A release would change the identifier shape

- **WHEN** a release would change the identifier shape the collapsible rules are conditioned on
- **THEN** the change is not made in a release that documents no migration for it
- **AND** the change is not made in a release that treats it as internal

#### Scenario: A consumer's existing toggle stops being styled

- **WHEN** a change would cause a consumer's correctly-marked collapsible to stop matching the framework's rules
- **THEN** the change is treated as breaking regardless of whether any selector was deleted

### Requirement: The dark theme remains a supported surface

The framework SHALL continue to ship a dark theme, activated by the documented class on the root element. The dark theme SHALL declare every custom property the default theme declares, so that no component resolves a default-theme value while the dark theme is active. No release SHALL remove, rename, or silently repoint the theme.

#### Scenario: A consumer activates the dark theme

- **WHEN** a consumer adds the documented class to the root element
- **THEN** every component that reads a theme custom property resolves it from the dark theme

#### Scenario: A component falls back to a default-theme value

- **WHEN** a component reads a custom property that the dark theme does not declare
- **THEN** verification fails
- **AND** the failure names the property that has no dark-theme value

#### Scenario: The theme is active but absent

- **WHEN** the built stylesheet contains no rule activating the dark theme
- **THEN** verification fails

#### Scenario: A build tool change alters the palette

- **WHEN** a toolchain change resolves a theme colour to a different value
- **THEN** the change is treated as a defect rather than as equivalent output
- **AND** the resolved values are compared, not only the set of property names

#### Scenario: The theme survives a compiler upgrade

- **WHEN** the framework is compiled by a newer version of its Sass compiler
- **THEN** every theme custom property still resolves to its recorded value
- **AND** a successful compilation is not accepted as evidence that the theme survived

#### Scenario: A release would drop the theme

- **WHEN** a release would remove or rename the dark theme
- **THEN** it is declared as a breaking change with a migration
- **AND** no release removes it silently

#### Scenario: Automatic mode is mistaken for the theme

- **WHEN** the dark theme is active
- **THEN** it is activated by the documented class
- **AND** the framework does not claim an automatic mode it does not implement

### Requirement: The toggle is operable without a pointer

The control that opens and closes a collapsible SHALL be reachable by keyboard and SHALL indicate focus visibly. A framework SHALL NOT remove its own control from the tab order as a way of hiding it.

#### Scenario: A keyboard-only user reaches the toggle

- **WHEN** a user traverses the page using only the keyboard
- **THEN** the collapsible toggle is reachable
- **AND** operating it opens and closes the body

#### Scenario: The toggle receives focus

- **WHEN** the toggle is focused
- **THEN** a visible focus indicator is rendered

#### Scenario: A stylesheet hides the toggle off-screen

- **WHEN** the control is hidden from view
- **THEN** it remains focusable and remains operable by keyboard

### Requirement: No collapsible body is clipped

An expanded collapsible SHALL display its body in full regardless of the body's height. The framework SHALL NOT impose a fixed maximum height on expanded content.

#### Scenario: A very tall body is expanded

- **WHEN** a collapsible body is taller than any fixed viewport height
- **THEN** all of its content is visible
- **AND** no part of it is cut off without a means of reaching it

#### Scenario: A short body is expanded

- **WHEN** a collapsible body is shorter than that threshold
- **THEN** it renders as before

### Requirement: Documented toggle markup is valid

Markup the framework documents as the way to use a component SHALL be valid HTML. Where the framework styles an element only by class, the documented element SHALL be one that is permitted in the position the framework requires it to occupy.

#### Scenario: A consumer copies the documented navbar markup

- **WHEN** a consumer copies the navbar markup exactly as documented
- **THEN** the result contains no HTML validity violation

#### Scenario: The framework's own documentation is validated

- **WHEN** the documentation is built and validated
- **THEN** the markup it demonstrates reports no element-content or element-permitted-content violation

#### Scenario: An existing consumer uses the previous element type

- **WHEN** a consumer's stylesheet targets the previous element type for the toggle's bars
- **THEN** the change to the documented element type is declared as breaking, with the substitution stated

### Requirement: The framework does not make render-blocking third-party requests

The shipped stylesheet SHALL NOT, by default, cause the consumer's page to block rendering on a request to a third-party host the consumer did not ask for.

#### Scenario: A consumer installs the framework

- **WHEN** a consumer includes the shipped stylesheet
- **THEN** no third-party stylesheet or font request is initiated by it

#### Scenario: A consumer wants the framework's fonts

- **WHEN** a consumer opts in to the framework's font stack
- **THEN** the framework provides a documented way to load them
- **AND** the opt-in is discoverable rather than being the default

### Requirement: The configuration surface stays reachable and keeps working

The framework SHALL continue to be configurable by a consumer building from its source, through the documented mechanism, and that mechanism SHALL NOT change without being declared as breaking with a migration stated. A configuration value a consumer can set today SHALL remain settable in the release that replaces the build toolchain.

#### Scenario: A consumer configures the framework's palette

- **WHEN** a consumer overrides a theme colour when consuming the framework from source
- **THEN** the override is honoured
- **AND** the framework declares the value as overridable rather than assigning it unconditionally

#### Scenario: The toolchain is replaced

- **WHEN** a release replaces the tools the framework's source is compiled with
- **THEN** the documented configuration mechanism still works afterwards
- **AND** a consumer who configured the framework on the previous release needs no change

#### Scenario: The configuration mechanism changes

- **WHEN** a release would move configuration to a different mechanism
- **THEN** it is declared as breaking with the substitution for the previous form stated
- **AND** it is not presented as an internal refactor of the build

### Requirement: Internal constants are distinguishable from configuration

The framework SHALL make clear which values a consumer can configure and which are internal. A value that assigning before the import cannot change SHALL be recorded as internal at its own declaration, so the distinction is discoverable at the point of use rather than learned from a silent no-op.

#### Scenario: A consumer assigns an internal value

- **WHEN** a consumer assigns a value the framework treats as internal
- **THEN** the assignment has no effect
- **AND** the declaration records that the value is internal rather than leaving it to be inferred from its name

#### Scenario: A consumer looks for the configuration surface

- **WHEN** a consumer wants to know what the framework lets them configure
- **THEN** configurable values are distinguishable from internal constants
- **AND** the distinction does not rest on the variable's name alone

#### Scenario: An internal value is proposed as configurable

- **WHEN** a value currently treated as internal is proposed to become configurable
- **THEN** it is declared as configurable, documented, and validated
- **AND** it is not made overridable incidentally, adding an undocumented and unvalidated public surface

#### Scenario: The framework adopts explicit module boundaries

- **WHEN** the framework's sources move to a system with explicit module boundaries
- **THEN** internal values become private by construction rather than by convention
- **AND** any value a consumer can configure today remains configurable, or its loss is declared as breaking with a migration

### Requirement: Components read their colours from the theme

A component's colours SHALL come from the theme's custom properties rather than from values fixed when the stylesheet is built, so that changing the theme changes what the component renders. Where a colour is deliberately independent of the theme, that SHALL be recorded at its declaration rather than left to look like an oversight.

#### Scenario: The theme changes

- **WHEN** the active theme changes
- **THEN** every component colour that is meant to follow the theme follows it
- **AND** no component keeps a value fixed at build time

#### Scenario: A component fixes a colour when the stylesheet is built

- **WHEN** a component's colour is computed at build time rather than read from a custom property
- **THEN** it does not follow the theme, and the component renders a light-theme value while the rest of the page is dark
- **AND** that is a defect unless the declaration records why the colour is theme-independent

#### Scenario: A colour happens to be the same in both themes

- **WHEN** a colour carries the same value in every theme
- **THEN** it is still expressed as a custom property, so a theme can decide it
- **AND** being identical today is not a reason to fix it when the stylesheet is built

#### Scenario: A colour is genuinely theme-independent

- **WHEN** a colour is the same regardless of theme by intent, such as a text highlight
- **THEN** it may stay literal
- **AND** the declaration states that this is deliberate
