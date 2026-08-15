# Public projection contract

## Authority and boundary

This repository is not the factual authority. The permanently private
`professional-source` owns canonical facts, evidence references, permissions,
approvals, and internal decisions. This repository owns only its public
representation.

The accepted contract is exactly `professional-public-projection/v1`, numeric
version `1`. The private repository is authoritative for
`contracts/professional-public-projection.v1.schema.json`; this repository keeps
a byte-identical copy at the same relative path for autonomous validation. A
review command in the authority verifies equality. Builds do not compare across
repositories and no automatic transfer bypasses human approval.

## Accepted and rejected material

The closed schema accepts only the contract identifier and version, `publicId`,
approved `values`, independent site/CV representations, and indispensable
generation time and language metadata. Unknown fields are rejected.

Private evidence, internal locators, open questions, disputed, unreviewed, or
unapproved facts, internal editorial notes, evidentiary documents, secrets,
unnecessary personal data, approval internals, traceability, and the canonical
source are rejected or structurally impossible.

## Self-contained consumer

`data/professional-public-projection.v1.json` is the sole productive input. It
is an empty synthetic fixture until a later human-approved transfer.

`loadPublicProjection` is a generic loader for controlled callers and tests: the
caller supplies both paths. `loadLocalPublicProjection` is the parameterless
productive entry. It resolves only this repository's schema and projection
relative to its own module, and the validation CLI uses that local entry. The
generic loader does not make arbitrary caller-provided paths safe; productive
code must use the local entry.

The consumer parses both JSON files, validates the closed public schema, rejects
prohibited private fields, and verifies identifiers and site/CV representation
references. It does not establish factual truth, permission, approval, transfer
authorization, repository visibility, or publication authorization.

Contract synchronization is an external review operation owned by the private
authority. Site build, check, test, preview, and deploy never compare against or
read the private repository. Run:

```powershell
npm run projection:validate
npm test
npm run check
npm run build
```

Scripts, tests, check, build, preview, and deploy contain no path or dependency
on the private repository. A valid artifact is not publication authorization;
transfer, visibility, and deployment remain separate human decisions.

See [ADR 001](decisions/001-private-source-public-projection.md).
