# Spec Delta

## MODIFIED Requirements

### Requirement: Published artifacts are a defined, complete set

A release SHALL publish a defined set of artifacts, and SHALL fail rather than publish an incomplete set. The set SHALL include everything the documentation tells consumers to obtain, and every asset the published stylesheet loads at runtime — including any typeface files and the licence notice that must travel with them. Published artifacts SHALL be traceable to the repository and commit they were built from.

#### Scenario: A documented artifact is missing

- **WHEN** a release would omit an artifact the documentation directs consumers to
- **THEN** the release fails
- **AND** a smaller set is not accepted as a partial release

#### Scenario: The source distribution is omitted

- **WHEN** consumers are documented as building from the framework's source
- **THEN** the release publishes a source archive containing that source
- **AND** a release carrying only compiled CSS does not satisfy the documented path

#### Scenario: An asset the stylesheet loads at runtime is missing

- **WHEN** a release omits a typeface file the published stylesheet references
- **THEN** the release fails
- **AND** a set carrying only the stylesheets does not satisfy the published artifact set

#### Scenario: An artifact's origin is unprovable

- **WHEN** a consumer needs to determine which build a downloaded artifact came from
- **THEN** the release records the repository and commit it was built from

### Requirement: Released artifacts are served from the tagged repository without a package registry

A release SHALL be consumable over the open internet without a package registry. The released stylesheets, and every asset they load at runtime, SHALL be served by open CDNs that resolve them directly from the tagged repository tree, and the release SHALL verify that each documented CDN URL serves the tagged build. Because the CDNs read the repository tree rather than the GitHub Release attachments, a release SHALL commit the artifacts and referenced assets it publishes at the tag.

#### Scenario: A third-party site links the CDN URL

- **WHEN** a website links the documented CDN URL for a released version
- **THEN** it receives the stylesheet built from that tag
- **AND** no package registry is involved

#### Scenario: Artifacts are attached but not committed

- **WHEN** a release attaches the stylesheets to the GitHub Release but the tagged tree does not contain them
- **THEN** the CDN URL for that tag does not resolve to the released artifact
- **AND** the release is incomplete even though the GitHub Release download succeeds

#### Scenario: A referenced asset is attached but not committed

- **WHEN** a release attaches a typeface file the stylesheet references but the tagged tree does not contain it
- **THEN** the CDN URL the stylesheet resolves that asset to does not resolve
- **AND** the release is incomplete even though the GitHub Release download succeeds

#### Scenario: The CDN serves a stale build

- **WHEN** the artifact at a documented CDN URL differs from the artifact attached to the release for that tag
- **THEN** verification fails

#### Scenario: A documented CDN URL uses a mutable alias

- **WHEN** a documented CDN URL uses `@latest`, a partial version, a branch or a commit instead of an exact tag
- **THEN** verification fails, because such a URL can drift and the CDNs cannot reliably purge it

#### Scenario: A corrected release is needed

- **WHEN** a released artifact must be superseded
- **THEN** the correction is published under a new tag rather than by mutating the existing tag's URL
- **AND** no documented URL depends on a mutable alias or a cache purge
