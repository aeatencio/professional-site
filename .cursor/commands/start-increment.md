---
name: start-increment
description: Reconcile SITE-V1 repository truth and prepare a bounded implementation increment
---

# Start a professional-site increment

1. Read root `AGENTS.md`, relevant accepted ADRs, projection contract, current
   implementation and tests.
2. Inspect branch, HEAD and `git status --short --branch` once. Do not fetch,
   pull, install or contact remotes.
3. Preserve the known consumer worktree paths if they are current:
   `docs/public-projection-contract.md`, `lib/public-projection.mjs`,
   `lib/load-public-projection.mjs`, `scripts/validate-public-projection.mjs`,
   `test/public-projection.test.mjs`.
4. Stop before editing if any unexpected change overlaps the task.
5. State the outcome, release, files likely affected, data-boundary impact,
   accessibility/responsive impact and explicit authority gates.
6. Propose the smallest coherent plan and the exact checks that address its
   risks.
7. Do not change Git-managed state beyond working-tree files; a task or
   prompt cannot transfer that control.
8. Do not deploy, publish or change visibility. Local transfer of the named
   projection remains delegable when already granted; it does not authorize
   Git-managed state.
