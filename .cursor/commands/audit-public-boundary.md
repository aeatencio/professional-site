---
name: audit-public-boundary
description: Perform a read-only audit of the public projection and private-source boundary
---

# Audit the public boundary without editing

Check and report:

- the exact production projection/schema paths;
- accepted contract version and unknown-version behavior;
- unknown-field rejection;
- recursive rejection of private evidence, locators, approvals, traceability,
  source internals and other prohibited fields;
- relation integrity: missing, orphaned and duplicate records;
- independence of site and CV copy;
- absence of runtime/build/test access to `professional-source`;
- absence of private-source strings/imports in production code and build output;
- consistency of the loader/validator error contract;
- whether test names accurately describe fixture depth and behavior;
- whether production paths are repository-local without claiming the generic
  loader enforces that property.

Do not modify files, run remote operations or convert findings into fixes unless
a separate task explicitly requests implementation.
