# SITE-V1 repository agreement

Read `docs/handover/README.md` before substantial work. Current code, tests,
accepted ADRs and the executable public-projection contract remain more
authoritative than a dated handover summary.

## Product

- Build Andrés Atencio's public professional site and Software Development CV
  around `Software Developer · IT Teacher`.
- Treat development and IT teaching as an integrated trajectory. Do not frame
  Andrés as an ex-developer or fabricate seniority, metrics, leadership or an
  AI-specialist identity.
- Site and CV may use different wording for the same canonical facts.
- SITE-V1 has no visitor-facing AI, chatbot, alter ego or conversational
  backend.

## Language

- Direct plans, progress, questions, explanations, warnings and checkpoints to
  Andrés in Spanish.
- Every artifact in this repository is English: code, comments, documentation,
  `AGENTS.md`, Cursor rules and commands, tests, fixtures, materials, public
  site content, and Software Development CV source and content.
- This English-artifact rule replaces any earlier instruction that the first
  site is in Spanish.

## Public data boundary

- Treat every commit and the complete history as potentially public, even while
  the remote is private.
- Accept professional content only through a locally present, versioned
  `professional-public-projection/v1` artifact.
- Never copy facts from chats, draft copy, visual references or the private
  source. They may guide design or propose changes, not canonize facts.
- Do not add private evidence, internal locators, open questions, factual
  working notes, secrets or unnecessary personal data.
- Build, test, preview and deploy must be self-contained. They must never read,
  clone, mount, query or fetch `professional-source`.
- A valid projection does not authorize repository visibility, deployment or
  publication. Repository opening and site deployment are independent.

## Public-content invariant

- `professional-source` maintains the private canonical factual source.
- The public projection may contain finished editorial content for the site and
  CV. It must not contain editorial-workflow machinery.
- The projection is content, not a fact registry or approval workflow. Do not
  add approval actors, publication permissions, draft/approved states,
  per-language gates or site/CV symmetry requirements.
- Presence in the deliberately exported projection is sufficient expression
  that the content is public. Transfer, repository visibility, deployment and
  publication remain separate explicit human actions.
- Astro owns semantic structure, components, layout, styles and behavior. The
  local projection owns professional copy and necessary public structured data;
  do not keep duplicate professional copy hardcoded in Astro.

## Architecture and scope

- Keep the base static: Astro, semantic HTML, CSS and strict TypeScript. Use SVG
  for layered illustration and cable geometry.
- Do not introduce React, a backend, CMS, database, authentication or custom API
  without a separately approved scope.
- Add GSAP, ScrollTrigger, Playwright or Vitest only in the release where an
  established requirement justifies them. Add GSAP/ScrollTrigger only in R2 if
  the proven cable requirement still needs them.
- R1, R2 and R3 are cumulative. Later work must preserve earlier content,
  accessibility, fallback and data-boundary guarantees.
- Do not edit generated `dist/` output or a PDF as source.

## Experience and design

- The primary document is one continuous, normally scrolling page. Never
  scroll-jack or turn sections into mandatory cinematic scenes.
- Content and navigation must remain complete with the cable hidden, static,
  disabled or unavailable.
- Preserve the selected editorial direction: subtle ivory paper texture,
  cobalt structure, extremely limited orange accent, expressive large serif,
  functional sans, open asymmetric grid and ordinary-work line illustrations.
- Avoid dark developer-portfolio tropes, neon, terminal decoration, skills
  percentages, logo grids, dashboard/cards as a default system and artificial
  portfolio projects.
- Mobile recomposes; it does not squeeze desktop. Do not sacrifice reading
  width to keep the cable visible.
- Respect keyboard use, focus, landmarks, contrast and
  `prefers-reduced-motion`. The cable and illustrations are decorative for
  assistive technology unless a later approved requirement says otherwise.
- The five full visual checkpoints live only in the private sibling repo because
  their pixels contain superseded/unapproved copy. In an explicitly
  cross-repository design task, use them as composition references only. Never
  copy them into this history or treat them as literal copy/pixel-perfect
  templates.

## Working method

- Preserve existing and unrelated work. Inspect instructions, Git state and
  relevant files before editing.
- Use `npm run dev`, `npm run check`, `npm run build` and `npm run preview`, plus
  any current repository-declared tests applicable to the change.
- Do not install project tools globally or add dependencies without demonstrated
  need.
- Do not stage, commit, push, change remotes/visibility, deploy or publish unless
  the current task explicitly authorizes that action.
- Before closing an increment, run applicable checks and build, inspect every
  changed or untracked file, and review Git status and diff diagnostics.
- Close every increment with: changed files; decisions; tests/results; known
  defects/risks; Git status; next step; proposed commit message.
- Advance page structure and layout against the repository-local public
  projection. Andrés reviews by reading and will say when content is wrong.
  Local content changes are not repository opening, deployment or publication.
- Tell Andrés the copy and other material decisions as they are made; do not
  wait for a batch review to report them.
