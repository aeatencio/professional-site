# Public-content cross-repository workflow

## Boundary

`professional-site` consumes a local, closed
`professional-public-projection/v1`. It never reconstructs public copy from the
private factual source and never accesses the private repository during build,
test, preview, runtime or deploy.

The projection contains deliberate public content:

- shared public name, identity and language;
- finished SITE-V1 copy;
- independent CV copy.

It contains no approval workflow, permissions, actors, editorial states,
private evidence, locators, factual questions or working notes.

## Consumer flow

1. A human deliberately transfers a named exported projection into
   `data/professional-public-projection.v1.json`.
2. The site validates version and closed shape.
3. Astro imports that same local JSON and renders its professional content.
4. Tests and build run without any private-repository access.
5. Andrés reviews the result and separately decides deployment/publication.

Site and CV do not need equivalent content. Independence of wording does not
make `cv` optional; a valid projection always contains a complete CV.

## Ownership

- The projection owns professional text and required public structured data.
- Astro owns semantic HTML, components, layout, styles and interaction.
- Do not duplicate projection-owned copy in Astro.
- Do not add fact IDs, approval flags or relation machinery to place content.

## Cross-repository work

For an explicitly cross-repository transfer, report the source file, contract
version, validation result and target path. Confirm that no private material
crossed and keep Git state and proposed commits separate.

No script in this repository transfers content, compares against the sibling
repository or changes remotes, visibility, deployment or publication.
