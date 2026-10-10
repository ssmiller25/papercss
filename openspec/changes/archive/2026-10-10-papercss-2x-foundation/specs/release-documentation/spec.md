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

### Requirement: The documentation points at the artifacts this repository publishes

Every download, install and build instruction in the documentation SHALL reference artifacts published by this repository. An instruction pointing at another project's releases SHALL be treated as a defect, since it delivers a different framework than the one being documented.

#### Scenario: A download button targets another project

- **WHEN** a documented download link resolves to a release published elsewhere
- **THEN** verification fails
- **AND** the link is repointed at this repository's release rather than left as a working link to the wrong artifact

#### Scenario: Build instructions target another project

- **WHEN** the documentation tells a consumer to clone or build from a repository other than this one
- **THEN** verification fails
- **AND** the sources are known to differ, so following the instruction produces a different result

#### Scenario: A consumer follows the primary download path

- **WHEN** a consumer uses the documentation's main download control
- **THEN** they receive an artifact published by this repository

### Requirement: The documented version has one source

The version the documentation names SHALL come from a single place, and SHALL be verified against the released version rather than restated by hand. A version duplicated across files SHALL NOT be left unverified.

#### Scenario: The documented version drifts from the release

- **WHEN** the version the documentation names disagrees with the version being released
- **THEN** verification fails
- **AND** a stale download link is treated as a build failure rather than a cosmetic defect

#### Scenario: A version is stated in several places

- **WHEN** the same version appears in more than one documented location
- **THEN** the locations read from the single source rather than repeating the literal
- **AND** the number of hand-edits a release requires does not grow with the number of pages mentioning it

### Requirement: Every documented way to obtain the framework is satisfiable

Where the documentation describes more than one way to obtain or consume the framework, each SHALL be satisfiable by what a release actually publishes. A documented path that no release supports SHALL be treated as a defect.

#### Scenario: A documented consumption path has no artifact

- **WHEN** the documentation describes consuming the framework in a way the published set does not support
- **THEN** verification fails
- **AND** the path is either supported by the release or removed from the documentation

#### Scenario: A manual release step remains

- **WHEN** a step of publishing is still performed by hand
- **THEN** the documented procedure states so explicitly
- **AND** it does not imply an automation that does not exist

### Requirement: No documented way to obtain the framework requires a package registry

The framework SHALL be obtainable without any package registry. A release SHALL NOT publish to npm or any other registry, and the documentation SHALL NOT instruct consumers to install the framework from one, because such a path cannot be satisfied. Download and CDN instructions SHALL be offered instead, and the CDN URL SHALL be derived from a tagged release of this repository.

#### Scenario: A consumer follows an install instruction

- **WHEN** the documentation tells a consumer to install or add the framework
- **THEN** the instruction resolves to a GitHub Release artifact or a CDN URL derived from a tagged release
- **AND** no instruction depends on a registry publication that does not exist

#### Scenario: A registry-only consumption path is documented

- **WHEN** a documented path requires a package registry
- **THEN** verification fails, because no release publishes one
- **AND** the path is either replaced with the CDN or Release path or removed

#### Scenario: The package metadata advertises a publication channel

- **WHEN** the repository's package metadata or ignore files exist only to support a registry publication
- **THEN** they are removed, so the repository does not advertise a channel it does not use

### Requirement: The documentation site is published at the repository's canonical address

The documentation SHALL be published at a stable address owned by this repository, and every link to the documentation from the repository or its metadata SHALL use that address rather than another project's.

#### Scenario: A repository link names the documentation site

- **WHEN** the README or repository metadata links to the documentation
- **THEN** it points at this repository's canonical address

#### Scenario: The documentation resolves to another project's domain

- **WHEN** a canonical link or site metadata names the upstream project's domain as this project's documentation
- **THEN** it is treated as a defect and repointed

#### Scenario: The custom domain is not yet configured

- **WHEN** the site is published before the custom domain is registered
- **THEN** the build and publish still succeed at the default address
- **AND** the custom domain is a separate deployment step rather than a build prerequisite

### Requirement: The documentation states how a consumer verifies a release

The documentation SHALL state how a consumer verifies a downloaded artifact and the release it came from, using the mechanisms the project actually produces — a build-provenance attestation, an immutable release, and a signed tag. It SHALL NOT document a verification path the project does not produce.

#### Scenario: A consumer wants to verify a release

- **WHEN** a consumer looks for how to verify an artifact
- **THEN** the documentation gives the exact commands for the mechanisms in use

#### Scenario: A verification path is documented but not produced

- **WHEN** the documentation describes a verification mechanism the release does not provide
- **THEN** it is treated as a defect

#### Scenario: A verification mechanism is used but undocumented

- **WHEN** the project signs releases by a mechanism the documentation does not mention
- **THEN** consumers cannot verify, and the omission is treated as a defect