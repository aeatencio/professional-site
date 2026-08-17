# Quality gates

Run only checks relevant to the current increment, but never omit a gate whose
risk the change creates. Use current `package.json` scripts rather than assuming
this dated list is exact.

## Repository and diff

- Read all applicable `AGENTS.md` and Cursor rules.
- Inspect branch/HEAD and working tree before editing.
- Preserve unrelated user changes.
- Run `git diff --check`.
- Inspect staged, unstaged and untracked files before closing.
- Do not edit generated `dist/` or PDF output as source.

## Public-data boundary

- Projection version and schema validate.
- Unknown versions and fields reject.
- The closed schema excludes private/internal fields wherever content objects
  occur.
- Site and CV content remain independent where intended.
- No source evidence, locator, open question, working note or full private payload
  enters this repository.
- No code, script, test, build or deployment reads/fetches
  `professional-source`.
- Production entry points use explicit repository-local projection paths.
- Generic loader behavior and documented guarantees agree.
- Error behavior is consistent enough for callers/tests to rely on it.

## Static site

- Clean install works with the declared Node/npm versions when dependency work
  requires it.
- `npm run check` passes.
- repository-declared tests pass.
- `npm run build` passes and produces expected static routes.
- Links and anchors resolve; external links use appropriate semantics.
- Page remains understandable when client JavaScript or cable mode is off.
- No raw internal identifiers or debug overlays ship in production.

## Content and coherence

- Every professional statement comes from the public-content projection.
- English site and English CV do not contradict.
- Historical technologies remain contextualized.
- Product stack is not misread as personal contribution.
- No superseded title, duration, certification or exact availability value
  reappears from a mockup/draft.
- Surveda scope remains bounded to approved evidence.
- Headings, names, dates, link labels and calls to action are consistent.

## Responsive and accessibility

- Semantic landmarks and heading order are valid.
- Keyboard navigation, menu, focus visibility and focus return work.
- Skip/navigation anchors do not force animation.
- Contrast and readable measure are acceptable.
- At least 320 px width has no unintended horizontal overflow.
- Desktop, tablet and mobile recompose without hiding essential content.
- `prefers-reduced-motion` preserves full content and function.
- Cable/illustrations are ignored by assistive technology when decorative.
- Touch targets and hover-independent states are usable.

## Cable-specific R2

- Pure state resolver is deterministic for position/profile.
- S0–S3 direct entry and reverse release are covered.
- Fast scroll, threshold reversal, anchor jumps, reload, history and resize
  converge correctly.
- Cable never blocks/crosses interactive controls.
- Interactive/static/off modes share content and navigation.
- Safari/iOS viewport behavior is checked when R2 reaches a testable vertical.

## CV/PDF-specific

- PDF is generated from source, never manually corrected.
- One or two A4 pages according to approved selection.
- No clipping, overlap or accidental blank page.
- Text is selectable/extractable in logical order and ATS-friendly.
- Links, visible labels, language and metadata are correct.
- Stable filename and route exist; every site access points to the same artifact.
- Site/CV projection consistency test passes.

## Release-only gates

- Production build and preview correspond to the reviewed commit.
- Public-history privacy audit passes.
- SEO title/description, canonical URL, social metadata, icons and 404 are
  correct.
- Performance and asset budgets are reviewed.
- Real mobile and agreed browser matrix pass.
- Deployment/domain/HTTPS checks pass.
- Andrés explicitly approves deployment/publication and repository visibility
  separately.

## Stop conditions

Stop and report rather than improvise when:

- repository state differs materially from the task assumptions;
- the local public projection is missing/invalid;
- a change would require private-source access from the site build;
- a factual/content decision is absent;
- a new dependency or architecture expands scope materially;
- a destructive, remote or publication action lacks authority.
