# Architecture and R1 scope

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
  and languages. The current private V1 renders it at `/cv/`.

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

See the [public projection contract](public-projection-contract.md) and
[ADR 001](decisions/001-private-source-public-projection.md).
