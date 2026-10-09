# Spec Delta

## Purpose

Defines how the repository resolves the development dependency findings that are reachable from its build, and justifies those that cannot affect a consumer.

## ADDED Requirements

### Requirement: Reachable dependency findings are resolved

A dependency finding classified as reachable from the build or development workflow SHALL be resolved rather than accepted as documentation.

#### Scenario: A reachable finding is resolved

- **WHEN** a finding classified as reachable is addressed
- **THEN** `npm audit` no longer reports it

#### Scenario: A reachable finding is left open

- **WHEN** a reachable finding is not resolved
- **THEN** the change is incomplete

### Requirement: Consumers cannot be affected by an unresolved finding

A finding left unresolved SHALL be shown not to affect a consumer of the shipped stylesheet.

#### Scenario: A finding remains open

- **WHEN** a finding is not resolved
- **THEN** it is demonstrated that consumers use the prebuilt stylesheet and do not execute the affected dependency
