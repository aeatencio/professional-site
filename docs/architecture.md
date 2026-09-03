# Architecture and release scope

SITE-V1 is a static Astro site: semantic HTML, CSS and strict TypeScript.
Its main page is one continuous, normally scrolling document that remains
complete without the future decorative cable.

The repository-local
`data/professional-public-projection.v1.json` is the authority for professional
copy and required public structured data. Astro owns document structure,
components, layout, styles and behavior. Professional copy must not be
duplicated in Astro source.

The projection is organized around the real artifacts:

- `shared`: English language, public name, professional identity, broad
  location, public contact email and profile links;
- `site`: title, description and content for the five SITE-V1 sections,
  including explicit software roles, current-development examples, teaching
  copy and compact education items;
- `cv`: independent Software Development CV content for profile, software
  experience, current development, teaching, education, technical background
  and languages. The current private V2 renders the A4 composition at `/cv/`
  and the US Letter composition at `/cv/letter/`, from one shared document.
  Home and the CV pages link those routes and serve matching static PDFs from
  `public/cv/`, generated from the print stylesheet rather than `window.print()`.
  The canonical public origin is `https://andresatencio.com`; on-site navigation
  stays on relative paths. Versioned PDFs are kept in sync by fingerprinting the
  effective print inputs of the built CV pages: the full HTML for `/cv/` and
  `/cv/letter/` (head, metadata, `@page`, chrome and `#cv-main`), every local
  stylesheet those documents load, every local font or image they reference,
  `Astro.site`, and the `Page.printToPDF` options for each paper size. The
  fingerprint is conservative: on-screen-only chrome, skip-link markup,
  screen-only CSS in a shared stylesheet, or other referenced local assets can
  force a reprint even when print output would not change. That false-positive
  cost is preferred to a heuristic that lets a stale PDF pass.

It is not a public fact registry and contains no fact IDs, approvals,
permissions, editorial states, actors or audit timestamps. Presence in the
projection means the content was deliberately prepared and transferred as
public content.

The private `professional-source` repository owns the canonical factual source
and the editable version of public content. This site consumes only its local,
validated copy. Build, test, preview, runtime and deploy never read, clone,
mount or query the private repository.

The closed schema is the public allowlist. Unknown fields fail validation, so
private evidence, locators, factual questions and working notes are
structurally excluded without a redundant blacklist walker.

R1 establishes the static site and private print-ready CV. R2 may add cable
behavior only when required; R3 finalizes the CV, access points and release.
Repository visibility, deployment and publication remain separate explicit
human actions.

## Presentation ownership

Illustrations, SVG structure, cable geometry and scroll interaction belong only
to `professional-site`. The repository boundaries remain:

- `professional-source` owns canonical professional facts and the editable
  public editorial content;
- the public projection owns transferred public professional copy and necessary
  public structured data;
- `professional-site` owns presentation, illustrations, SVG assets, behavior
  and interaction.

The projection is not configuration for the graphic system. Do not add
illustration types, asset names, cable states, scroll hooks, visual permissions
or visual-workflow flags to it.

## Illustration asset architecture

Production illustration uses deliberately prepared web SVG rather than treating
one PNG or WebP as the transformable source. The hero scene should retain
maintainable semantic groups such as `person`, `chair`, `table`, `laptop`,
optional `notebook`, `mug` and `cable-origin`.

Grouping preserves the ability to show, hide, fade, translate, scale, transform
or sequence elements later without requiring every group to animate. An
automatic vector trace with excessive nodes and arbitrary paths is not an
acceptable final production asset; the SVG must remain reasonably clean and
maintainable.

The hero SVG owns only the laptop port or connector and the cable's immediate
origin. The long page-spanning route is a separate visual component,
provisionally named `JourneyCable`. This separation lets the site calculate
geometry for the current layout and viewport, connect objects across sections,
progressively reveal or hide the route, and revise its shape without editing
the hero illustration.

Current compositional intent, chapter roles, cable behavior and
scroll-perception direction live in
[Proposal 1 — Continuous surface with resting cable](design/proposal-1-continuous-surface-cable.md).
This architecture document retains technical boundaries, ownership and interaction-stack
decisions only.

## Interaction stack

R2 retains the lightweight site architecture: Astro, semantic HTML, inline SVG,
CSS and strict TypeScript. It does not introduce React, Vue or another UI
framework for the interaction.

GSAP and ScrollTrigger are the intended candidates only after the graphic
system and static `JourneyCable` route are sufficiently resolved and a concrete
scroll-animation need remains. Do not add them speculatively. Canvas is not the
base for this interaction; Three.js and Lottie are not central formats. Avoid
artificial smooth scrolling, scroll-jacking, mandatory scroll snapping and
unnecessary animation dependencies. Native browser scrolling remains normal,
and the page remains complete without animation or JavaScript enhancement.

See the [public projection contract](public-projection-contract.md) and
[ADR 001](decisions/001-private-source-public-projection.md).
