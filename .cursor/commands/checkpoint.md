---
name: checkpoint
description: Verify the current SITE-V1 increment and report a reviewable checkpoint
---

# Close a professional-site increment

1. Run the repository-declared checks/tests applicable to the change and
   `npm run build` when executable site behavior changed.
2. Run `git diff --check`; inspect staged, unstaged and untracked paths.
3. Inspect built/output content as needed for the specific risk. Never edit
   generated output as source.
4. Confirm no private-source dependency or prohibited/private value entered
   code, fixtures, docs, build output or Git history.
5. For UI work, report desktop/mobile, keyboard/focus, reduced-motion and
   no-JavaScript/static fallback checks performed.
6. Report changes, decisions, test results, known defects/risks, Git status,
   next step and proposed commit message.
7. Do not stage, commit, push, deploy or publish.
