# Current state

**Cut-off:** 2026-08-16

## Stack

- Astro 7 static output
- strict TypeScript
- Node 24 and npm 11 project constraints
- no React, backend, CMS, database, authentication or visitor-facing AI

## Public content consumer

`data/professional-public-projection.v1.json` contains the current English
professional content for SITE-V1. It is organized as:

- `shared`: public name, professional identity and language;
- `site`: title, description and five-section copy;
- `cv`: currently empty and independent.

The local JSON is validated against the closed v1 schema before development,
check and build. Astro imports that same JSON directly. The previous
`values[]`/`representations` join, privacy-key walker, relational-integrity
checks and Vite loader URL plugin were removed.

The generic filesystem loader remains for validation tools and controlled
tests. Production page rendering does not use it.

## Product state

Implemented:

- one continuous Home → Experience → Background → Working together → Contact
  document;
- English landmarks, navigation and skip link;
- first ivory/cobalt/orange visual-system and responsive layout;
- professional copy sourced from the local projection;
- self-contained validation, tests and static build.

Not yet complete:

- final fact-rich professional copy and public contact links;
- illustrations and static cable anchor treatment;
- full responsive/browser accessibility QA;
- R2 cable behavior;
- Software Development CV and production release.

## Boundary

Build, tests, preview and runtime never access `professional-source`. Private
evidence, locators, factual questions and working notes are structurally absent.
The projection contains no approval or editorial-workflow machinery.

Transfer, commits, pushes, repository visibility, deployment and publication
remain separate explicit human actions.
