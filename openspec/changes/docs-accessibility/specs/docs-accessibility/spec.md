# Spec Delta

## Purpose

Defines the documentation site's page chrome as valid, accessible markup, measured separately from the demos a reader copies.

## ADDED Requirements

### Requirement: Documentation pages declare their language

Every generated documentation page SHALL declare its language.

#### Scenario: A page declares no language

- **WHEN** a generated page omits its `lang` attribute
- **THEN** verification fails

### Requirement: Landmark regions are distinguishable

When a page contains more than one landmark of the same kind, each SHALL have a non-empty, unique accessible name.

#### Scenario: A page repeats a landmark

- **WHEN** a page contains more than one landmark of the same kind
- **THEN** each is given a non-empty, unique accessible name

### Requirement: Form controls are labelled and uniquely identified

Form controls in the documentation page chrome SHALL have an associated label, and controls of the same kind on one page SHALL NOT share a name.

#### Scenario: A control has no label

- **WHEN** a form control in the page chrome has no associated label
- **THEN** verification fails

#### Scenario: A control repeats a name

- **WHEN** two or more controls on one page share a `name`
- **THEN** verification fails

#### Scenario: A group of controls has no description

- **WHEN** a `fieldset` in the page chrome has no `legend`
- **THEN** verification fails

### Requirement: Buttons and interactive controls are explicit

Buttons in the documentation SHALL declare a `type`, and controls that act as buttons SHALL be real `<button>` elements rather than inputs styled to look like buttons.

#### Scenario: A button omits its type

- **WHEN** a button in the page chrome omits its `type`
- **THEN** verification fails

#### Scenario: An input is used as a button

- **WHEN** an `input` is used where a button is meant
- **THEN** it is replaced with a `<button>` element

### Requirement: Elements are closed and label associations are not redundant

Every element requiring a closing tag SHALL be closed, and a label that already wraps its control SHALL NOT carry a redundant `for` attribute.

#### Scenario: An element is implicitly closed

- **WHEN** an element that requires a closing tag is left open
- **THEN** verification fails

#### Scenario: A label repeats its control association

- **WHEN** a label wrapping a control also names it with `for`
- **THEN** the redundant attribute is removed

### Requirement: The page-chrome baseline is tightened to zero

The recorded page-chrome baseline SHALL be reduced to zero in the same change that clears the violations, so the ceiling never becomes permanent.

#### Scenario: The chrome region reaches zero

- **WHEN** the chrome violations are fixed
- **THEN** the recorded ceiling is set to zero in the same change

#### Scenario: A later change reintroduces a violation

- **WHEN** a new violation appears in the page-chrome region
- **THEN** verification fails
