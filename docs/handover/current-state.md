# Current state · last reported checkpoint

**Cut-off:** 2026-08-15
**Verification status:** reconstructed from prior repository reports; Cursor
must reconcile this with the actual worktree before editing.

## Workspace reconciliation at integration (2026-08-15)

Observed locally during handover integration. This section overrides stale
hashes and the four-file list below. Do not fetch, reset or rewrite history to
match the older reported anchor.

- HEAD: `a4554e52e017fb5f57f770a2fa0a9781a9a7cbca`
  (`feat: validate and consume public projection v1 locally`), branch `main`.
- Known pre-existing worktree paths to preserve (modified or untracked is
  expected): `docs/public-projection-contract.md`, `lib/public-projection.mjs`,
  `lib/load-public-projection.mjs`, `scripts/validate-public-projection.mjs`,
  `test/public-projection.test.mjs`.
- Durable language policy confirmed during this verification: interact with
  Andrés in Spanish; every artifact and public product in this repository is
  English.

## Reported anchor

- Last reported `professional-site` commit: `c3e9859`.
- Repository remote was private, but complete history was treated as potentially
  public.

Do not fetch, reset or rewrite history to match this hash.

## Stack and foundation

- Astro 7.2.1, static output.
- Strict TypeScript 6.0.3.
- Node 24 and npm 11 project constraints.
- Local commands include `dev`, `check`, `build` and `preview`.
- DATA-BOUNDARY-001 accepted.
- No React, backend, CMS, database, authentication or visitor-facing AI.

## Last reported consumer work

Four files were originally reported as an active/recent base. Local workspace
reconciliation added `lib/public-projection.mjs`. Preserve all five if they
remain current work:

- `docs/public-projection-contract.md`;
- `lib/public-projection.mjs`;
- `lib/load-public-projection.mjs`;
- `scripts/validate-public-projection.mjs`;
- `test/public-projection.test.mjs`.

Reported behavior: a reusable loader reads schema and projection JSON, validates
`professional-public-projection/v1` and returns only valid public data. Reported
tests cover real loading, independent site/CV copy, version/unknown-field
rejection, prohibited private/internal fields, relational integrity and absence
of direct private-source dependency.

Cursor must determine whether these files are committed, uncommitted or
superseded and preserve current user work.

## Review findings to reconcile

1. The generic loader accepts supplied paths, while the production CLI uses
   fixed local paths. Document the narrower real guarantee or add a separate
   production entry point; do not claim the generic helper itself enforces repo
   locality.
2. Some validation failures reportedly return error arrays while relational
   failures throw directly. All fail closed, but the public error contract may
   need normalization and contextualization.
3. Some test names reportedly promise recursive rejection at any depth while
   their fixtures exercise only one nested location. Strengthen coverage or
   narrow the names.

## Product state

Completed:

- static repository foundation;
- permanent private/public boundary;
- executable public contract/validation reported;
- product direction and five desktop composition checkpoints.

Not yet completed:

- confirmed first real public projection in this repo;
- full English content implementation;
- final visual system and responsive implementation;
- R2 cable behavior;
- Software Development CV source and PDF;
- browser/device QA, metadata, deployment and publication.

## Immediate next sequence

1. Integrate and review this handover.
2. Reconcile actual Git state and the five known consumer files.
3. Finish consumer-contract hardening if current code confirms the review
   findings remain open.
4. Wait for an explicitly approved public projection; do not synthesize one
   here.
5. Implement R1 from approved content, first without cable motion.

Older documents used R1.1-A/B/C labels inconsistently. Prefer concrete
deliverables over the label.
