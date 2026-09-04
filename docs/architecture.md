# Architecture and release scope

SITE-V1 is a static Astro site: semantic HTML, CSS and strict TypeScript.
Its main page is one continuous, normally scrolling document.

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

The current product is the static site and the print-ready Software
Development CV. Repository visibility, deployment and publication remain
separate explicit human actions.

## Presentation ownership

Illustrations and interaction belong only to `professional-site`. The
repository boundaries remain:

- `professional-source` owns canonical professional facts and the editable
  public editorial content;
- the public projection owns transferred public professional copy and necessary
  public structured data;
- `professional-site` owns presentation, illustrations, assets, behavior
  and interaction.

The projection is not configuration for the graphic system. Do not add
illustration types, asset names, visual permissions or visual-workflow flags
to it.

## Interaction stack

The site keeps a lightweight architecture: Astro, semantic HTML, CSS and
strict TypeScript. It does not introduce React, Vue or another UI
framework for interaction.

Do not add animation or interaction dependencies speculatively. Avoid
artificial smooth scrolling, scroll-jacking and mandatory scroll snapping.
Native browser scrolling remains normal. The page stays complete and
accessible without animation or JavaScript enhancement.

See the [public projection contract](public-projection-contract.md) and
[ADR 001](decisions/001-private-source-public-projection.md).
