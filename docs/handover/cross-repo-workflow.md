# Public-consumer cross-repository workflow

## Boundary

`professional-site` is a consumer. It does not reconstruct, query or repair the
private canonical source.

The only accepted transfer is a locally present, versioned, sanitized, validated
and explicitly approved `professional-public-projection/v1` artifact. A
technical export or schema-valid file alone is insufficient.

## Consumer flow

1. A named projection is approved and transferred through a separate human
   action.
2. The transferred file enters the explicit repository-local consumer path.
3. The site validates version, shape, allowed fields and relational integrity.
4. Invalid input fails the consumer; it does not fall back to private data,
   drafts or network access.
5. Site and CV representations render independently from approved projection
   values.
6. Build, tests and preview run self-contained.
7. Andrés reviews preview/diff and later makes a separate publication decision.

## What Cursor may do

- inspect both repositories for an explicitly cross-repo audit;
- implement producer or consumer code in the repository named by the task;
- validate a transferred artifact already authorized and present;
- report required producer changes without editing the private repo when the
  task is site-only.

## What Cursor may not infer

- that a new source value is factually approved;
- that a valid export may be moved;
- that presence in the site repo authorizes deploy/publication;
- that a private repository may be read at build time;
- that a site representation must share CV copy;
- that a visual mockup or ChatGPT draft may fill a missing projection value.

## Cross-repo checkpoint

When a task legitimately affects both repos, report separately for each:

- branch, HEAD and working tree;
- exact files changed;
- validation/tests;
- data crossed or deliberately did not cross;
- proposed commit message;
- remote actions performed (normally none).

Never create a single commit narrative that obscures the two independent
histories and authority gates.
