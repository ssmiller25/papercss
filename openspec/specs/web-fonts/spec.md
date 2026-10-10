# web-fonts Specification

## Purpose

Defines how the framework supplies its own typefaces to a consumer: shipped and
served first-party alongside the stylesheet, applied by default so the framework
looks like itself out of the box, and refuseable or redirectable by a consumer
building from source.

## Requirements

### Requirement: The distribution ships the typefaces it uses

The framework SHALL include the typeface files its stylesheet references in the
same distribution as the stylesheet, so a consumer renders the framework's
intended typography without obtaining a font from a host the framework does not
control.

#### Scenario: A consumer obtains the framework

- **WHEN** a consumer takes the stylesheet from a published release or a documented CDN
- **THEN** the typeface files the stylesheet references are served from that same source

#### Scenario: A referenced typeface is omitted

- **WHEN** a distribution omits a typeface file the stylesheet references
- **THEN** the distribution is incomplete

### Requirement: The default stylesheet applies the framework's typefaces

The default build SHALL apply the framework's body and heading typefaces without
an opt-in step, so that a consumer who includes only the stylesheet sees the
framework's intended typography, and text falls back to a generic family only if
a typeface cannot be loaded.

#### Scenario: A consumer makes no change

- **WHEN** a consumer includes only the default stylesheet and nothing else
- **THEN** body text is styled with the framework's body typeface
- **AND** headings are styled with the framework's heading typeface

#### Scenario: A typeface cannot be loaded

- **WHEN** a typeface file fails to load
- **THEN** the affected text falls back to a generic family
- **AND** the page remains legible

### Requirement: Typefaces are served from the source the consumer chose

The framework SHALL serve its typefaces from the same source as the stylesheet
that references them, and the default stylesheet SHALL NOT cause the consumer's
page to fetch a typeface from a host the consumer did not choose.

#### Scenario: A consumer links the documented CDN

- **WHEN** a consumer links the default stylesheet from the documented CDN
- **THEN** the typefaces are fetched from that same CDN

#### Scenario: The default stylesheet is used

- **WHEN** a consumer includes only the default stylesheet
- **THEN** no typeface request is made to a font host the consumer did not choose

### Requirement: Typefaces are partitioned by script range

The framework SHALL partition its typeface files by script and declare a range
for each, so that a page fetches only the subsets its content needs.

#### Scenario: A page uses a single script

- **WHEN** a page contains text in one script
- **THEN** the browser fetches only the typeface subset for that script

#### Scenario: A page uses extended characters

- **WHEN** a page contains characters outside the primary subset
- **THEN** the matching subset is fetched on demand

### Requirement: A consumer building from source can refuse or redirect the typefaces

A consumer building the framework from source SHALL be able to disable the
bundled typefaces, or substitute an alternate source, through the documented
configuration and without editing the framework's sources.

#### Scenario: A consumer disables the bundled typefaces

- **WHEN** a consumer configured to disable the typefaces builds from source
- **THEN** the output references no typeface file
- **AND** the font stack falls back to a generic family

#### Scenario: A consumer substitutes an alternate source

- **WHEN** a consumer configured with an alternate typeface source builds from source
- **THEN** the output references that source instead of the bundled files

### Requirement: The typeface files carry the licence they are distributed under

The typeface files SHALL be distributed with the licence text and copyright
notice their licence requires, kept distinct from the framework's own licence.

#### Scenario: A consumer inspects the typeface licence

- **WHEN** a consumer looks for the terms covering the bundled typefaces
- **THEN** the required licence text and copyright notice are present alongside the files

#### Scenario: The framework licence and the typeface licence are conflated

- **WHEN** the typeface files are distributed under the framework's own licence
- **THEN** this does not satisfy the requirement, because the two licences differ
