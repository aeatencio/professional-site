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

- `shared`: English language, public name and professional identity;
- `site`: title, description and content for the five SITE-V1 sections;
- `cv`: independent future CV copy; it may be empty until R3.

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

R1 establishes the static content and presentation. R2 may add cable behavior
only when required; R3 consolidates the CV and release. Repository visibility,
deployment and publication remain separate explicit human actions.

See the [public projection contract](public-projection-contract.md) and
[ADR 001](decisions/001-private-source-public-projection.md).
