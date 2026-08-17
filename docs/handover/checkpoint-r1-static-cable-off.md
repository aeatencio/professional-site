# Increment checkpoint

> Architecture note (2026-08-16): this checkpoint records the pre-simplification
> R1 implementation. Its `values[]`, `representations`, approved-copy mapper and
> Vite loader plugin were subsequently removed. The current projection directly
> contains site/CV content; see `docs/architecture.md` and ADR 001.

## Outcome

SITE-V1 now has a readable English R1 draft: one continuous document with
landmarks and in-page navigation (Home → Experience → Background → Working
together → Contact). The page consumes `loadLocalPublicProjection()` and will
render `representations.site` text when present, but the visible voice is
editorial draft copy — not empty-state or data-boundary flags. Cable motion is
absent without advertising a mode on the document. The synthetic fixture stays
empty. This is draft structure for Andrés to read, not a transferred
projection, repository opening, deployment or publication.

## Scope and authority

- Repository: `professional-site` only
- Release/increment: first R1 static draft, cable off, visitor-facing flags removed
- Explicitly authorized Git/remote/publication actions: none
- Actions deliberately not taken: fetch, pull, stage, commit, push, remote
  visibility change, deploy, publish; no read or write of `professional-source`

## Files changed

| File | Change | Reason |
| --- | --- | --- |
| `src/pages/index.astro` | Continuous page with English draft chapters; loads local projection | Readable R1 draft |
| `src/layouts/BaseLayout.astro` | English `lang`, skip link, header, nav, footer; no cable flag | Landmarks without debug attrs |
| `src/components/PrimaryNav.astro` | Primary in-page navigation | Shared nav |
| `src/components/ApprovedSiteCopy.astro` | Renders site texts only when present | No empty-state banners |
| `src/lib/site-copy.mjs` | Group site representation text by section | Presentation mapping |
| `src/lib/site-copy.d.ts` | Types for the helper | `astro check` |
| `src/styles/global.css` | Ivory/cobalt/orange tokens, type, open grid, h3 | Visual system start |
| `src/env.d.ts` | Astro client types | Strict check |
| `lib/load-public-projection.d.ts` | Types for the existing loader | `astro check` |
| `astro.config.mjs` | Preserve loader `import.meta.url` during prerender | Self-contained build |
| `data/professional-public-projection.v1.json` | `metadata.language`: `en` | Align fixture with English site |
| `test/site-copy.test.mjs` | Loader, site-text-only copy, no boundary announcements | Guard code vs page voice |
| `docs/handover/checkpoint-r1-static-cable-off.md` | This checkpoint | Increment close |

Unchanged consumer files: `docs/public-projection-contract.md`,
`lib/public-projection.mjs`, `lib/load-public-projection.mjs`,
`scripts/validate-public-projection.mjs`, `test/public-projection.test.mjs`.

## Decisions

- Product/design: Header identity is `Andrés Atencio`; H1 is once
  `Software Developer · IT Teacher`. Home lede frames the integrated trajectory
  without mentioning projection or fixture. Experience uses three draft
  headings (Selected work, Software chronology, Teaching and practice).
  Background uses three draft headings (Completed qualification, Pedagogical
  training, Broader study) and states that incomplete study is not a degree.
  Working together describes collaboration by work shape and generic
  part-time/remote availability, with no weekly number. Contact names write,
  public profiles and the CV as a utility. Orange is one identity mark.
  Removed visitor-facing empty-state banners, `data-cable="off"`, and
  projection/process language from the page.
- Technical: Page still calls `loadLocalPublicProjection()`. Site copy joins
  `representations.site` to `values[].kind`/`id` for placement and never uses
  `values[].value`. Approved texts render only when present. System/web-safe
  font stacks; no new dependencies or GSAP. A Vite pre-transform keeps the
  loader’s module URL so prerender can read the local schema and fixture.
- Data/content: Fixture stays empty. Only `metadata.language` is `en`.
  `html lang` comes from that metadata. No Surveda, Manas, years, email,
  GitHub, metrics or invented jobs.
- Deferred: real approved projection copy; illustrations; static cable
  markers; CV route; R2 cable; font loading; browser visual QA; CTA hierarchy
  once contact facts exist.

## Verification

| Command or inspection | Result | Risk addressed |
| --- | --- | --- |
| `npm test` | 12 passed, 0 failed | Consumer + site-copy contract |
| `npm run check` | 0 errors, 0 warnings, 0 hints | Types and projection validity |
| `npm run build` | `/index.html` built | Static prerender can load local projection |
| `git diff --check` | clean | Whitespace |
| Built `dist/index.html` | `lang="en"`, five chapters, skip link, draft copy, no projection/cable/fixture strings, no fact IDs | Boundary in code, voice on the page |

## Public-boundary review

- Projection path/version: `data/professional-public-projection.v1.json`,
  `professional-public-projection/v1`
- Private/internal fields absent: yes, in source and built HTML
- No private-source dependency: yes
- Site/CV representation consistency: both arrays remain empty; page does not
  render `representations.cv`
- Build output inspected: `dist/index.html` only; not edited as source

## UX/accessibility review

- Viewports/devices: CSS recomposes below 44rem to a single column; no browser
  device pass in this increment
- Keyboard/focus: skip link, in-page anchors, `:focus-visible` cobalt outline
- Reduced motion/static/off: no motion; no public cable flag; reduced-motion
  keeps `scroll-behavior: auto`
- Overflow/layout: measure capped on desktop; mobile drops the open second
  column rather than squeezing text
- Known untested surface: real desktop/tablet/mobile visual pass, screen reader
  pass, 320 px overflow in a browser

## Known defects and risks

- Draft availability wording (“part-time and remote-friendly”) is editorial
  stance from the product brief, not a projection fact. Andrés may revise it.
- Working together still has no `values[].kind` mapping for later approved
  copy.
- Skill kind currently groups into Experience; that must not become a skills
  cloud when real copy arrives.
- Visual system is token/layout start only: no illustrations yet.
- Astro prerender required a loader URL preserve plugin; a future bundler
  change could break local file resolution again.

## Git state

- Branch and HEAD: `main` at `56e56eb` (`docs: record draft-copy cadence in the working method`)
- Staged: none
- Unstaged: `astro.config.mjs`, `data/professional-public-projection.v1.json`,
  `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/styles/global.css`
- Untracked: `lib/load-public-projection.d.ts`, `src/components/`, `src/env.d.ts`,
  `src/lib/`, `test/site-copy.test.mjs`,
  `docs/handover/checkpoint-r1-static-cable-off.md`
- Remote actions performed: none

## Next step

Andrés reads the draft page and marks what is wrong. Do not invent
professional facts here.

## Proposed commit message

`feat: add readable R1 draft with cable off`
