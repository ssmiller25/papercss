# Spec Delta

## MODIFIED Requirements

### Requirement: The documentation points at the artifacts this repository publishes

Every download, install and build instruction, and every asset the documentation directs a page to load, SHALL reference artifacts published by this repository. An instruction or asset pointing at another project's or third party's release SHALL be treated as a defect, since it delivers a different artifact than the one being documented.

#### Scenario: A download button targets another project

- **WHEN** a documented download link resolves to a release published elsewhere
- **THEN** verification fails
- **AND** the link is repointed at this repository's release rather than left as a working link to the wrong artifact

#### Scenario: Build instructions target another project

- **WHEN** the documentation tells a consumer to clone or build from a repository other than this one
- **THEN** verification fails
- **AND** the sources are known to differ, so following the instruction produces a different result

#### Scenario: A font is loaded from a third-party host

- **WHEN** the documentation directs a page to load a typeface from a host other than this repository's published assets
- **THEN** verification fails
- **AND** the reference is repointed at the framework's own copy rather than left as a working link to a third party

#### Scenario: A consumer follows the primary download path

- **WHEN** a consumer uses the documentation's main download control
- **THEN** they receive an artifact published by this repository
