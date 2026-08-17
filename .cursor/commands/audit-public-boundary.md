---
name: audit-public-boundary
description: Perform a read-only audit of the public projection and private-source boundary
---

# Audit the public boundary without editing

Check and report:

- the exact production projection/schema paths;
- accepted contract version and unknown-version behavior;
- unknown-field rejection;
- closed-schema exclusion of private evidence, locators, questions, notes,
  traceability and source internals;
- absence of approval/workflow machinery and public fact-to-copy relations;
- independence of site and CV content, including an empty CV;
- absence of runtime/build/test access to `professional-source`;
- absence of private-source strings/imports in production code and build output;
- consistency of the loader/validator error contract;
- whether production paths are repository-local without claiming the generic
  loader enforces that property;
- whether professional copy has a single authority in the local projection
  rather than duplicate Astro literals.

Do not modify files, run remote operations or convert findings into fixes unless
a separate task explicitly requests implementation.
