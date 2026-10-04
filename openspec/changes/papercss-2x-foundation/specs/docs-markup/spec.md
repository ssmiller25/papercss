# Spec Delta

## Purpose

Defines the documentation site as reference implementation. The markup a framework's documentation demonstrates is markup users copy, so its defects are not cosmetic: an invalid element nesting in an example becomes invalid markup in every project that follows the example.

That asymmetry — copied examples matter more than the page around them — is why the two are held to separate recorded results rather than one shared count.

## ADDED Requirements

### Requirement: Documentation markup is valid and accessible

Every page the documentation build produces SHALL satisfy the committed accessibility and validity rules, except where an exclusion is recorded as a deliberate framework exception.

#### Scenario: A page is built

- **WHEN** the documentation is built
- **THEN** every generated page is validated
- **AND** pages at every depth, including the site root, are included

#### Scenario: A documented example becomes invalid

- **WHEN** a component demo emits markup that violates a rule
- **THEN** verification fails and identifies the page and rule

#### Scenario: The site root is skipped

- **WHEN** the file set under validation is determined
- **THEN** the site root is included alongside nested pages
- **AND** the file set does not depend on shell glob semantics

### Requirement: Documentation is self-describing to assistive technology

Pages SHALL declare their language, and landmark regions SHALL be distinguishable from one another when a page contains more than one of the same kind.

#### Scenario: A page declares no language

- **WHEN** a generated page omits its language
- **THEN** verification fails

#### Scenario: A page repeats a landmark

- **WHEN** a page contains more than one landmark of the same kind
- **THEN** each is given a non-empty, unique accessible name

### Requirement: Form controls in examples are labelled and uniquely identified

Form controls appearing in documentation SHALL have an associated label, and controls of the same kind on one page SHALL NOT share a name.

#### Scenario: An example repeats a control name

- **WHEN** two or more controls on one page share a `name`
- **THEN** verification fails

#### Scenario: An example omits a control type

- **WHEN** a button in an example omits its `type`
- **THEN** verification fails

#### Scenario: A group of controls has no description

- **WHEN** a `fieldset` in an example has no `legend`
- **THEN** verification fails

### Requirement: Recorded exclusions are deliberate

Where a rule is not enforced, the reason SHALL be recorded in the repository. A disabled rule SHALL be distinguishable from a rule that was never considered.

#### Scenario: The exclusion set is audited

- **WHEN** the committed validation configuration is reviewed
- **THEN** every disabled rule states why it is disabled

#### Scenario: A rule is disabled to absorb known violations

- **WHEN** a rule is switched off rather than its violations fixed
- **THEN** the count of violations it was hiding is recorded so the debt is visible

### Requirement: Style debt does not outlive its introduction

Markup that is valid but stylistically inconsistent with the rest of the site SHALL be brought into line, and the recorded baseline SHALL be tightened in the same change, so that the baseline never becomes a permanent ceiling.

#### Scenario: A dominant style rule is fixed

- **WHEN** the recorded baseline is dominated by one stylistic rule
- **THEN** that rule is brought into line across the templates
- **AND** the baseline is tightened in the same change

#### Scenario: A cleanup lands without tightening the baseline

- **WHEN** a change reduces a violation count
- **THEN** the change is incomplete until the recorded ceiling matches the new count

### Requirement: Copied examples reach zero, independently of the page around them

The live demos a reader is meant to copy SHALL reach zero recorded violations, and SHALL reach it without a page-chrome cleanup being credited toward it. A demo's result SHALL NOT be improved by an unrelated change to the template that surrounds it.

#### Scenario: The demos are valid but the page is not

- **WHEN** the demo region reaches zero while the page-chrome region still has violations
- **THEN** the demo requirement is satisfied on its own
- **AND** the remaining chrome violations do not keep the demo region open

#### Scenario: A demo is made invalid to absorb a template change

- **WHEN** a change resolves a template violation by altering the markup a demo emits
- **THEN** the demo region's recorded count increases
- **AND** the change fails on the demo region rather than passing on the chrome region's improvement

#### Scenario: A violation is absorbed by disabling a rule

- **WHEN** a demo's violations are cleared by switching a rule off rather than fixing the markup
- **THEN** the demo requirement is not satisfied
- **AND** the reason the rule is disabled is recorded

#### Scenario: A copied demo is checked on its own

- **WHEN** a consumer copies a demo verbatim into a page of their own
- **THEN** the markup reports no violation without the documentation's own scaffolding around it