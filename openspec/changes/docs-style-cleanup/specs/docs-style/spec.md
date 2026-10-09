# Spec Delta

## Purpose

Defines the documentation site's freedom from house-style deviations that would otherwise dominate the validation baseline, so the gate's recorded result reflects correctness rather than churn.

## ADDED Requirements

### Requirement: Attribute quoting is consistent

Documentation markup SHALL use the site's house attribute-quoting style throughout, and the rule enforcing it SHALL remain enabled rather than being switched off to absorb violations.

#### Scenario: A single-quoted attribute is used

- **WHEN** a template or content attribute uses a quote style other than the house style
- **THEN** verification fails

#### Scenario: The rule is disabled instead of the markup fixed

- **WHEN** the quoting violation count is reduced by disabling the rule
- **THEN** the requirement is not satisfied

### Requirement: Rendered output carries no template whitespace

Whitespace introduced by the templates SHALL NOT leak into the rendered pages.

#### Scenario: Template whitespace reaches the output

- **WHEN** a generated page contains trailing whitespace that originates in a template
- **THEN** verification fails

### Requirement: Presentation is not inlined in documentation markup

Presentation SHALL be expressed through stylesheets rather than inline `style` attributes.

#### Scenario: An inline style is present

- **WHEN** documentation markup carries an inline `style` attribute
- **THEN** verification fails

### Requirement: The style baseline is tightened when it is cleared

When the style violations are cleared, the recorded baseline SHALL be tightened in the same change, and every rule still disabled SHALL state why it is disabled.

#### Scenario: Style violations reach zero

- **WHEN** the recorded style violations are fixed
- **THEN** the recorded ceiling is set to the new count in the same change

#### Scenario: A cleanup lands without tightening the baseline

- **WHEN** a change reduces a style violation count
- **THEN** the change is incomplete until the recorded ceiling matches the new count
