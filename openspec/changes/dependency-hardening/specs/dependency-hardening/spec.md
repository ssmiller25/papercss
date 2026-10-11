# Spec Delta

## Purpose

Defines how the repository resolves the development dependency findings reachable from its build, closes its Dependabot backlog, and records the one finding it cannot fix as a tracked exception.

## ADDED Requirements

### Requirement: Resolvable dependency findings are resolved

A dependency finding that any published version can resolve SHALL be resolved in this repository rather than accepted as documentation.

#### Scenario: A resolvable finding is resolved

- **WHEN** a finding with a patched release is addressed
- **THEN** `npm audit` no longer reports it

#### Scenario: A resolvable finding is left open

- **WHEN** a finding with a patched release is not resolved
- **THEN** the change is incomplete

### Requirement: A finding with no patched release is a tracked exception

A dependency finding whose advisory covers every published version of the package, so that no upgrade resolves it, SHALL be recorded as a named exception carrying the advisory, its impact, and the dependency change required to remove it, and SHALL be tracked in an issue to be resolved outside this change. It SHALL NOT be silently accepted or suppressed.

#### Scenario: No patched release exists

- **WHEN** a finding's advisory range covers every published version of the package
- **THEN** an issue records the advisory, the impact, and the dependency change that would remove the package, and the finding is named as an exception

#### Scenario: An unfixable finding is hidden

- **WHEN** a finding with no patched release is accepted without a tracked issue naming it
- **THEN** the change is incomplete

### Requirement: The Dependabot backlog is closed

Every open Dependabot alert and every open Dependabot update pull request SHALL be closed. An alert SHALL close because the resolution lands, not by dismissal. A pull request whose fix is included in this change SHALL be commented with where the fix landed, closed rather than merged, and its branch deleted; a stale branch left by an already-closed pull request SHALL also be deleted. None SHALL remain open.

#### Scenario: An update is superseded

- **WHEN** a Dependabot update pull request's fix is already included in the change
- **THEN** the pull request is commented with where the fix landed, closed, and its branch deleted

#### Scenario: A Dependabot item is left open

- **WHEN** an open Dependabot alert, pull request, or branch remains after the change is merged
- **THEN** the change is incomplete

### Requirement: Consumers cannot be affected by an unresolved finding

A finding left unresolved SHALL be shown not to affect a consumer of the shipped stylesheet.

#### Scenario: An exception remains open

- **WHEN** a finding is left as an exception
- **THEN** it is demonstrated that consumers use the prebuilt stylesheet and do not execute the affected dependency
