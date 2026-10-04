# Spec Delta

## Purpose

Defines what a release owes the people upgrading to it. Every breaking change in 2.0 alters behaviour silently — a consumer who reads nothing but the release notes still gets a different framework, and nothing at build time tells them. This capability exists so that "what changed" and "what do I do" are written down rather than inferred from a diff.

## ADDED Requirements

### Requirement: The release history is recorded

The repository SHALL carry a changelog covering every release it has made, not only the current one. Each entry SHALL name its version and date and describe the changes a user could observe.

#### Scenario: A consumer wants to know what changed in a release

- **WHEN** a consumer looks for the contents of a release
- **THEN** the changelog has an entry naming the version and its date
- **AND** the entry describes user-visible changes rather than internal ones

#### Scenario: A tagged release has no entry

- **WHEN** the repository has a release tag with no changelog entry
- **THEN** the entry is reconstructed from what that release changed and recorded
- **AND** the reconstruction is identified as reconstructed rather than presented as contemporaneous

#### Scenario: A tag's changes cannot be determined

- **WHEN** a tag exists whose changes cannot be established from the repository
- **THEN** the gap is recorded explicitly
- **AND** the release is not silently omitted from the history

#### Scenario: Only the current release is documented

- **WHEN** the changelog begins at the version currently being developed
- **THEN** the earlier history is treated as missing rather than as out of scope

### Requirement: The upgrade path out of the previous major version is written

A breaking release SHALL ship a document that states, for each breaking change, what it was, what it is now, why it changed, and what a consumer must do about it.

#### Scenario: A consumer is affected by a breaking change

- **WHEN** a consumer upgrades past a breaking change without reading the stylesheet
- **THEN** the upgrade document states what changed and the substitution to make
- **AND** the before state is shown as something the consumer can recognize from their own code

#### Scenario: A change is breaking but undocumented

- **WHEN** a change is recorded as breaking
- **THEN** a corresponding section exists in the upgrade document in the same change
- **AND** an incomplete set is treated as an incomplete release rather than as a release with a thin document

#### Scenario: The two sets disagree

- **WHEN** the recorded breaking changes and the upgrade document's sections are compared
- **THEN** they match in both directions
- **AND** a section describing a non-breaking change is corrected rather than left as padding

#### Scenario: A consumer configures the framework through its build

- **WHEN** the framework is consumed as source rather than as a prebuilt stylesheet
- **THEN** the upgrade document states the configuration mechanism before and after
- **AND** shows the before form and the after form side by side

### Requirement: The release path is discoverable without being sought

Both documents SHALL be reachable from the repository's front page, so a consumer arriving to upgrade finds them without already knowing they exist.

#### Scenario: A consumer arrives at the repository

- **WHEN** a consumer reads the README looking for how to upgrade
- **THEN** both the changelog and the upgrade document are linked from it

#### Scenario: The upgrade document is present but empty

- **WHEN** a breaking release ships with the upgrade document containing no section for a recorded breaking change
- **THEN** the release is treated as incomplete
- **AND** an empty file is not accepted as satisfying the requirement

### Requirement: Release documents are written as changes land

The changelog and upgrade document SHALL be updated in the same change as the behaviour they describe, not reconstructed from memory afterwards.

#### Scenario: A behaviour change lands

- **WHEN** a change alters shipped behaviour
- **THEN** the corresponding release-document entry is written in that change
- **AND** the release is not documented retrospectively from a reconstructed diff

#### Scenario: Documentation is deferred to the end

- **WHEN** the entries for a group of changes are planned to be written after all of them land
- **THEN** each change is required to carry its own entry instead