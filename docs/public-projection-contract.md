# Public projection contract

## Authority and boundary

This repository is not the factual authority. The permanently private
`professional-source` owns canonical facts and the editable public-content
document. This repository owns presentation and consumes only the deliberately
transferred local projection.

The contract is `professional-public-projection/v1`, version `1`. The private
repository owns the authoritative schema; this repository keeps a byte-identical
copy at `contracts/professional-public-projection.v1.schema.json` for autonomous
validation.

## Public shape

The closed document has six top-level fields:

- `contract`, `version`, `publicId`;
- `shared`: English language, name and professional identity;
- `site`: title, description and Home, Experience, Background, Working
  together and Contact content;
- `cv`: independent CV content, currently allowed to be empty.

Home uses the shared professional identity as its H1. Other sections contain
headings, paragraphs and optional grouped subsections. The projection contains
no public fact ontology, `factId` relations, approval
actors, permissions, editorial states, audit timestamps or language-selection
workflow.

Unknown fields are rejected. That closed shape structurally excludes private
evidence, locators, factual questions, working notes, traceability and the
canonical source.

## Consumer

`data/professional-public-projection.v1.json` is the sole productive content
input. `loadLocalPublicProjection` validates that path for commands and tests.
Astro imports the same JSON after `projection:validate` succeeds; it does not
use a filesystem loader inside the prerender graph.

The projection owns professional copy and public structured data. Astro owns
HTML structure, components, layout, styling and behavior. Do not hardcode a
second copy of professional text in Astro.

The generic `loadPublicProjection` helper accepts caller-provided paths only for
controlled tests and tools. It does not make arbitrary paths production-safe.

```powershell
npm run projection:validate
npm test
npm run check
npm run build
```

No command reads or compares against `professional-source`. Export and transfer
occur outside this repository. A local projection does not authorize repository
visibility, deployment or publication.
