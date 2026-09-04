# SITE-V1 repository agreement

## Product

- Build Andrés Atencio's public professional site and Software Development CV
  around `Software Developer · IT Teacher`.
- Treat development and IT teaching as an integrated trajectory. Do not frame
  Andrés as an ex-developer or fabricate seniority, metrics, leadership or an
  AI-specialist identity.
- Site and CV may use different wording for the same canonical facts.
- SITE-V1 has no visitor-facing AI, chatbot, alter ego or conversational
  backend. There is currently no AI Project Advisor. If one is ever implemented
  after an explicit product-scope change, it belongs exclusively to this
  repository: prompts, providers, models, limits, hosting, secrets, analytics
  and behavior stay here. `professional-source` must never be a runtime
  dependency or a private source accessible to the advisor.

## Language

- Every artifact in this repository is English: code, comments, documentation,
  `AGENTS.md`, tests, fixtures, materials, public site content, and Software
  Development CV source and content.
- This English-artifact rule replaces any earlier instruction that the first
  site is in Spanish.

## Public data boundary

- Treat every commit and the complete history as potentially public, regardless
  of repository visibility.
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
- Local transfer of the named projection into this repository requires explicit
  task authority. Transfer does not authorize reading or modifying
  `professional-source`; a task that needs both repositories must declare both
  in scope.

## Public-content invariant

- `professional-source` maintains the private canonical factual source.
- The public projection may contain finished editorial content for the site and
  CV. It must not contain editorial-workflow machinery.
- The projection is content, not a fact registry or approval workflow. Do not
  add approval actors, publication permissions, draft/approved states,
  per-language gates or site/CV symmetry requirements.
- Presence in the deliberately exported projection is sufficient expression
  that the content is public. Local transfer of the named projection is not
  commit, push, repository visibility, deployment or publication.
- Astro owns semantic structure, components, layout, styles and behavior. The
  local projection owns professional copy and necessary public structured data;
  do not keep duplicate professional copy hardcoded in Astro.
- Do not add advisor or illustration configuration to the projection
  merely because those features exist.
- Advance page structure and layout against the repository-local public
  projection.

## Architecture and scope

- This repository owns presentation, design, assets, illustrations,
  interaction, animations, hosting, deployment, operational limits, analytics,
  and any later site-specific AI, including its prompts, models and providers.
- Keep the base static: Astro, semantic HTML, CSS and strict TypeScript. Use SVG
  for layered illustration.
- Do not introduce React, a backend, CMS, database, authentication or custom API
  without an explicit product-scope change.
- Do not add speculative dependencies. Add Playwright, Vitest or similar
  tooling only when an established requirement justifies them.
- Later work must preserve earlier content, accessibility, fallback and
  data-boundary guarantees.
- Do not edit generated `dist/` output or a PDF as source.

## Experience and design

- The primary document is one continuous, normally scrolling page. Never
  scroll-jack or turn sections into mandatory cinematic scenes.
- Content and navigation must remain complete without JavaScript or animation.
  Decorative illustration must not carry unique information.
- Preserve the selected editorial direction: subtle ivory paper texture,
  cobalt structure, extremely limited orange accent, expressive large serif,
  functional sans, open asymmetric grid and ordinary-work line illustrations.
- Avoid dark developer-portfolio tropes, neon, terminal decoration, skills
  percentages, logo grids, dashboard/cards as a default system and artificial
  portfolio projects.
- Mobile recomposes; it does not squeeze desktop. Do not sacrifice reading
  width.
- Respect keyboard use, focus, landmarks, contrast and
  `prefers-reduced-motion`. Illustrations are decorative for assistive
  technology unless a later approved requirement says otherwise.
- Historical SITE-V1 studio composition checkpoints and the continuous-surface
  cable proposal are preserved in `docs/design/references/studio/`. They
  document the graphic-direction process. They are not a work precondition,
  not the current implementation, not a specification and not production
  assets. Do not treat their copy as facts or their pixels as templates.
