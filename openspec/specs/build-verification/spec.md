# build-verification Specification

## Purpose
Defines the gates that decide whether this repository may ship a stylesheet and a documentation site, so that a defect in a build artifact is caught by a command rather than by a downstream consumer.

## Requirements

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

### Requirement: Dependency findings are audited live against the baseline

The repository SHALL audit its dependency findings against the count taken before the toolchain replacement, run live against the current tree rather than from a committed snapshot, so that a change in dependency risk is measurable rather than assumed.

#### Scenario: The dependency tree changes

- **WHEN** the audit is run after a dependency change
- **THEN** the current count is compared with the baseline

#### Scenario: The finding count rises

- **WHEN** the number of findings increases without an explanation
- **THEN** the increase is treated as a regression rather than accepted silently

### Requirement: Every remaining dependency finding is classified by reachability

For every dependency finding the toolchain replacement does not resolve, the audit SHALL classify whether it is reachable from the build or development workflow, at the time it is run, and SHALL NOT leave a finding unclassified.

#### Scenario: A finding is unreachable

- **WHEN** a finding cannot be reached by any build or development command
- **THEN** the reason is stated rather than the finding silently accepted

#### Scenario: A finding is reachable

- **WHEN** a finding can be reached by a build or development command
- **THEN** it is classified as reachable for resolution

#### Scenario: A finding is left unclassified

- **WHEN** a finding remains unclassified after the audit
- **THEN** the classification is incomplete

### Requirement: The documentation site is deployed from the verified build

The documentation site SHALL be published by an automated workflow from the same build the repository's gates verify, and SHALL NOT be published from an unverified or hand-uploaded tree.

#### Scenario: The documentation site is published

- **WHEN** the documentation site is deployed
- **THEN** the published pages are the output of the gated build

#### Scenario: The site is uploaded by hand

- **WHEN** the documentation is published outside the gated workflow
- **THEN** that is treated as a defect, since it bypasses the gates

### Requirement: A release is produced by a tag, and only from a verified tree

A release SHALL be triggered by pushing a version tag. The tag SHALL be the single source of truth for the release's version, and no artifact SHALL be published before the repository's own gates pass. A version disagreement SHALL fail the release rather than warn.

#### Scenario: The tag and the declared version disagree

- **WHEN** a release tag does not match the version the package declares
- **THEN** the release fails
- **AND** nothing is published

#### Scenario: The tree fails its gates

- **WHEN** a release is triggered from a commit whose gates fail
- **THEN** nothing is published
- **AND** the gates run before publication rather than after it

#### Scenario: The gate sequence is restated for the release

- **WHEN** a release workflow spells out the verification steps itself
- **THEN** that is treated as a second source of truth
- **AND** the release is required to invoke the same single entry point contributors run

#### Scenario: A prerelease is tagged

- **WHEN** a tag carries a prerelease version
- **THEN** the release is published as a prerelease
- **AND** it does not become the release consumers are offered as current

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

### Requirement: Released artifacts are signed and verifiable

A release SHALL be cryptographically verifiable without a long-lived signing key. Every released artifact SHALL carry a build-provenance attestation bound to this repository and the release workflow. A published release SHALL be immutable, so its assets and tag cannot be added to, modified or deleted afterwards, and the release tag SHALL be signed so the repository tree the CDNs serve is covered too.

#### Scenario: A consumer verifies a downloaded artifact

- **WHEN** a consumer checks a downloaded artifact's attestation against this repository and the release workflow
- **THEN** verification succeeds

#### Scenario: An artifact is substituted after publication

- **WHEN** a released artifact differs from the one the attestation was issued for
- **THEN** verification fails
- **AND** the release's immutability prevents the substitution being published in the first place

#### Scenario: A consumer links the CDN URL

- **WHEN** a consumer uses a CDN URL to obtain the stylesheet
- **THEN** the release tag's signature validates
- **AND** the served files match the digests recorded in the release's provenance

#### Scenario: A release carries no attestation

- **WHEN** a published release's artifacts have no attestation, or the release is not immutable
- **THEN** the release is treated as incomplete

#### Scenario: Signing requires a secret to be protected

- **WHEN** the signing mechanism is chosen
- **THEN** build provenance and release integrity use a short-lived certificate issued to the workflow identity rather than a stored key
- **AND** only the tag uses a key, and only one the maintainer already holds
