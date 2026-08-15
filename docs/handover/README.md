# Handover index · professional-site

**Cut-off:** 2026-08-15
**Classification:** safe for potentially public repository history
**Purpose:** durable product and implementation context for Cursor

This directory explains SITE-V1 around the current implementation. It contains
no private canonical payload, evidence, internal locator, candidate review or
publication approval.

## Reading order

1. Root [`AGENTS.md`](../../AGENTS.md).
2. [`project-charter.md`](project-charter.md).
3. [`current-state.md`](current-state.md).
4. [`product-brief.md`](product-brief.md).
5. [`design-direction.md`](design-direction.md).
6. [`release-roadmap.md`](release-roadmap.md).
7. [`quality-gates.md`](quality-gates.md).
8. [`cross-repo-workflow.md`](cross-repo-workflow.md).
9. Relevant accepted ADRs, projection contract, code and tests.

Use [`checkpoint-template.md`](checkpoint-template.md) at the end of every
increment. Five full-resolution composition checkpoints are deliberately kept
in the private sibling repo because their pixels contain unapproved or
superseded copy. Inspect them only during an explicitly cross-repository design
task and never copy them into this history.

## Authority rule

Current repository code, tests, accepted ADRs and the executable projection
contract override a dated handover statement. An approved local
`professional-public-projection/v1` controls public facts and representation
values. Visual references and draft documents never do.

If sources disagree, stop and identify whether the conflict is implementation,
contract, product or wording. Do not reach into the private repo to settle it.

## Stable boundary

The site consumes only an approved public projection already present in this
repo. Build, test, preview and deploy never access `professional-source`. Every
commit remains safe for possible public visibility.

## Operating roles

- ChatGPT Project retains primary product direction and cross-conversation
  continuity.
- Cursor is the primary coding agent and works from current repository truth.
- Andrés authorizes facts, wording, commits, pushes, visibility, deployment and
  publication.

No handover file grants any of those approvals.
