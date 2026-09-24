# Architecture and release scope

SITE-V1 is a static Astro site: semantic HTML, CSS and strict TypeScript.
Its main page is one continuous, normally scrolling document.

## Languages

English is the default language. Two pages have a Spanish counterpart:

| Page | English | Spanish | Renderer | Copy |
| --- | --- | --- | --- | --- |
| Home | `/` | `/es/` | `src/components/HomePage.astro` | `lib/home-copy.ts` |
| CV | `/cv/` | `/es/cv/` | `src/components/CvDocument.astro` in `CvLayout` | `lib/cv-copy.ts` |

`LOCALIZED_PATHS` in `lib/site-identity.mjs` is the single map of equivalent
pages; route files, the language switch, `hreflang` alternates and the
sitemap filter derive from it. Components, section IDs, styles and behavior are
shared by both languages. There is no browser-language detection, redirect,
client-side translation or internationalization dependency.

Each copy module returns an explicit object per language. English professional
copy comes directly from the unchanged local projection. Spanish is a manually
authored editorial adaptation of that public content. It adds no professional
facts and never reads the private source. Identity, contact values, company and
institution names, employment periods and technology names are reused. List
translations use projected organization, institution or language names, or the
English item text, as source keys, since the projection has no item IDs. New
unknown entries fail rather than silently falling back to English. When
projected wording changes, review the corresponding Spanish copy; tests verify
key coverage but cannot establish editorial equivalence. `lib/cv-copy.ts`
reuses the Spanish identity and shell labels from `lib/home-copy.ts`.

`LanguageSwitch.astro` supplies native EN/ES links with language names and
`aria-current`. On Home it sits in desktop navigation and the native mobile
disclosure; on the CV it sits in the minimal document header. It always links
to the equivalent page: Home to Home, CV to CV. Switching opens that page at its
beginning; section navigation stays within the current language. Everything
works without JavaScript. The CV header identity returns to the Home in the
page language.

Each page declares its own `lang`, canonical, description and social title;
`BaseLayout` emits reciprocal `en`/`es` alternates, `x-default` (English) and
`og:locale` from the page's alternates. The Home pages carry localized
ProfilePage JSON-LD with shared Person and WebSite IDs and reuse the social
image with localized alternative text. The CV pages keep the summary card and
no JSON-LD. The sitemap lists `/`, `/es/`, `/cv/` and `/es/cv/`.

Each CV language has an A4 and a US Letter PDF. `CV_PDF` in `lib/cv-pdf.mjs`
is keyed by language and paper format; each entry names its print route, public
file and download name:

| Language | A4 | US Letter |
| --- | --- | --- |
| English | `/cv/` → `/cv/andres-atencio-cv-a4.pdf` | `/cv/letter/` → `/cv/andres-atencio-cv-letter.pdf` |
| Spanish | `/es/cv/` → `/es/cv/andres-atencio-cv-es-a4.pdf` | `/es/cv/letter/` → `/es/cv/andres-atencio-cv-es-carta.pdf` |

The `letter/` routes are print formats of their CV: they canonicalize to it,
share its alternates and stay out of the sitemap. Home and the CV actions offer
the PDFs of the page language. The Spanish copy fits one page on both papers;
when Spanish wording changes, keep it within that constraint with concise
editing rather than smaller type.

Unit tests cover copy and source-key completeness; production verification
checks the built pages, metadata, sitemap, CV links, the four PDFs and the
absence of English CV text in the Spanish CV routes. `layout:check` runs the
navigation, keyboard, anchor, overflow and no-JavaScript checks on both Home
languages and both web CVs, including language switching between equivalent
pages.

## Public content and CV

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
  and the US Letter composition at `/cv/letter/`, from one shared document;
  the Spanish CV mirrors them at `/es/cv/` and `/es/cv/letter/`.
  Those routes are first-class document views of `andresatencio.com`: they
  reuse `BaseLayout` infrastructure in an explicit `document` shell, not the
  site’s primary navigation, mobile menu, directional header or footer. `/cv/`
  and `/es/cv/` are the canonical responsive web views. The `letter/` routes
  exist so US Letter print and PDF generation keep a stable route; on screen
  they match their CV. A4 and US Letter are paper formats for print and
  download, not web layout variants. On paper, the secondary column is anchored
  below Technical Experience; on a desktop screen, Profile spans the grid rows
  beside Technical Experience and the last row is flexible, so Teaching follows
  Technical Experience and Software experience follows Profile at the row gap,
  and a longer column only extends the bottom. This holds while Profile is at
  least as tall as Technical Experience, as in both languages today;
  `layout:check` fails if that changes. Below the mobile
  breakpoint the sections stack in source order. On Home, `CV` in the header navigates to a section between
  Background and Working together. That compact section presents a link to
  the web CV in the page language and direct links to both PDFs. The footer
  keeps a compact direct link to the same web CV. On the CV routes, a minimal
  header holds the identity link back to the site and the language switch, and
  download actions sit in the document flow. Print and
  PDF output exclude the global header, global footer, skip link and web
  download actions; they contain only the document. The canonical public
  origin is `https://andresatencio.com`; on-site navigation stays on relative
  paths. Versioned PDFs are kept in sync by fingerprinting the effective print
  inputs of the built CV pages: the full HTML for the four print routes
  (head, metadata, `@page`, on-screen actions and `#cv-main`), every local
  stylesheet those documents load, every local font or image they reference,
  `Astro.site`, and the `Page.printToPDF` options for each paper size. The
  fingerprint is conservative: on-screen-only actions, skip-link markup,
  screen-only CSS in a shared stylesheet, or other referenced local assets can
  force a reprint even when print output would not change. That false-positive
  cost is preferred to a heuristic that lets a stale PDF pass. The PDFs are
  printed in one canonical Linux environment (see the README); the PDFs
  themselves record their producer and embedded fonts, and verification
  rejects any PDF that was not printed there.

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
