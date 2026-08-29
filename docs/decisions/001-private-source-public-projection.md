# ADR 001: Consume a public-content projection

- Status: Accepted, revised
- Original date: 2026-08-13
- Revised: 2026-08-28
- Identifier: `DATA-BOUNDARY-001`

## Context

This repository and its history may become public, while professional evidence,
private locators, uncertainty and research notes must remain private. The site
also needs reproducible builds without privileged access.

The original contract represented public facts plus approval and editorial
workflow. That did not fit the real product: Andrés is the only owner/editor,
site copy may summarize several facts, and the CV does not need to mirror site
content.

## Decision

Consume a versioned, closed `professional-public-projection/v1` prepared in the
private repository and deliberately transferred here.

The projection contains finished public content organized as `shared`, `site`
and `cv`. It contains the professional copy and public structured values used by
the artifacts. Astro remains responsible for semantic structure, components,
layout, styles and behavior.

The projection contains no fact registry, fact-to-copy relations, approval
actors, permissions, draft/approved states, per-language gates or audit
timestamps. Site and CV content are independent in selection and wording;
`cv` is required and must be complete.

The local projection is validated against the closed schema before check,
development and build. Astro imports the same local JSON. The site never reads,
clones, mounts, queries or fetches `professional-source`.

This revision explicitly supersedes the earlier workflow-oriented portions of
DATA-BOUNDARY-001 while preserving its privacy boundary.

## Invariants

1. `professional-source` remains private.
2. Every site commit and historical commit remains public-safe.
3. Only the closed public projection enters this repository.
4. Private evidence, locators, questions and notes are excluded.
5. The site is self-contained.
6. Public professional copy has one authority: the local projection, not
   duplicate Astro literals.
7. Local transfer of the named projection, repository visibility, deployment
   and publication are independent. Each may require distinct authority.
   Local transfer is not visibility, deployment or publication.

## Consequences

The public schema itself is the allowlist, so no recursive prohibited-key walker
or relational-integrity engine is needed. Contract changes still require
explicit version handling and synchronization with the private authority.

An invalid or missing local projection stops validation. The site cannot repair
content by reaching into the private repository.

## Alternatives rejected

- Keep workflow flags: rejected because they model actors and states that do not
  exist.
- Keep public `values[]` plus `factId` representations: rejected because no real
  consumer needs the ontology or one-to-one mapping.
- Duplicate projection copy in Astro: rejected because it creates competing
  public-content authorities.
- Read the private source during builds: rejected because it breaks privacy and
  reproducibility.
