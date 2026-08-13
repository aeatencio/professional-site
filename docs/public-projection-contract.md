# Public projection contract

## Authority and boundary

This repository is not the complete factual authority. The permanently private
`professional-source` repository owns canonical facts, evidence references,
permissions, and internal decisions. `professional-site` is authoritative only
for the public representation implemented here.

The private source will produce a versioned, sanitized, validated, and
human-approved projection reserved as `professional-public-projection/v1`. This
repository accepts only that projection. A technically valid export does not by
itself authorize publication.

## Accepted and rejected material

The consumer accepts only facts and values explicitly approved for public use,
plus the minimum versioning and public metadata required by the eventual
contract. Site and CV may use different copy while representing the same
approved facts.

The consumer rejects private evidence, internal locators, open questions,
disputed or unapproved facts, internal editorial notes, evidentiary documents,
secrets, unnecessary personal data, and the complete canonical source. Chats,
copy drafts, and visual references can propose information but cannot establish
canonical facts or publication permission.

## Consumer guarantees

Every commit and the complete Git history are treated as potentially public.
Build, test, preview, and deploy are self-contained and never read, clone, mount,
or query the private repository. No automation may grant publication permission,
change repository visibility, publish, or deploy without human approval. Opening
the repository and deploying the site are independent decisions.

## Future executable contract

No exporter, importer, public schema, or exchange mechanism exists yet. R1.1
will define the executable contract only after the private source has been
structured and reviewed; this document intentionally does not speculate about
the exact exchange-file shape.

See [ADR 001](decisions/001-private-source-public-projection.md) for the boundary
decision.
