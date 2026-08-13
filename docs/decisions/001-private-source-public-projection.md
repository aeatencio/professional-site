# ADR 001: Consume an approved public projection

- Status: Accepted
- Date: 2026-08-13
- Identifier: `DATA-BOUNDARY-001`

## Context

The site repository's code and history may become public. A later deletion does
not remove sensitive content from earlier Git commits, so both the current tree
and the complete history must remain safe before any visibility change. The site
also needs reproducible builds that do not depend on privileged access.

Professional work includes evidence, open questions, permissions, and editorial
decisions that belong in a permanently private canonical source. Chats, draft
copy, and visual references may suggest information but do not establish truth.

## Decision

`professional-site` consumes only a versioned, sanitized, validated, and
human-approved projection produced by `professional-source`, with the future
identifier `professional-public-projection/v1`. This repository is authoritative
for its implemented public representation, not for the complete factual source.

It accepts approved public facts and the minimum public metadata required by the
contract. It rejects private evidence, internal locators, open questions,
disputed or unapproved facts, internal editorial notes, evidentiary documents,
secrets, unnecessary personal data, and the full canonical source. Site and CV
may use different copy for common approved facts.

The shared invariants are:

1. `professional-source` remains private.
2. Every site commit is potentially public, including historical commits.
3. Only a versioned, sanitized, validated, approved projection enters the site.
4. The site excludes private and internal material, disputed or unapproved
   facts, secrets, and unnecessary personal data.
5. Its build is self-contained and never reads, clones, mounts, or queries the
   private repository.
6. A technical export alone is not publication authorization.
7. Repository visibility and site deployment are independent decisions.
8. Chats, copy, and visual references may propose but cannot canonize facts.
9. Automation cannot change publication permissions or exposure without human
   approval.
10. The complete source is not duplicated between repositories.

## Reasons

Storing only the projection minimizes disclosure risk and keeps public history
reviewable. A self-contained consumer is reproducible in environments without
private credentials. Separating the canonical source from its representations
also lets site and CV use suitable wording without redefining facts.

## Consequences

The site cannot resolve uncertainty by reaching into the private repository; an
invalid, unapproved, or unavailable projection must stop ingestion. Contract
changes require explicit version handling. Opening the code repository does not
deploy the site, and deployment does not authorize opening the repository.

No executable contract or transfer mechanism is introduced in this increment.
R1.1 will define it after the private source is structured and reviewed.

## Alternatives rejected

- Store the full source and filter it at build time: rejected because sensitive
  material would enter both the repository and its history.
- Read the private source during builds: rejected because privileged coupling
  breaks self-contained reproducibility.
- Copy facts manually from chats or drafts: rejected because proposals are not
  canonical facts or publication approval.
- Equate export with publication consent: rejected because validation and human
  authorization are separate gates.

## Review conditions

Review this consumer decision if privacy requirements materially change, a
self-contained build becomes impossible, or the versioned projection cannot
represent the required public site and CV. Revision requires explicit human
approval and a complete history-safety assessment.
