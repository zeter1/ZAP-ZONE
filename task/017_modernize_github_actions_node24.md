# Task 017 — Modernize GitHub Actions to Node 24-compatible first-party actions

## WHY

Fresh CI evidence from PR #17 shows the current pinned `actions/checkout@v4.4.0` and `actions/setup-node@v4.4.0` are JavaScript actions that still target Node 20. GitHub's hosted runner forced them onto Node 24 and emitted a deprecation warning.

GitHub removed Node 20 from Actions runners on 2026-09-23 and explicitly tells workflow users to update to the latest action versions that support Node 24. Current official first-party repositories expose Node-24-era majors (`actions/checkout` v7 and `actions/setup-node` v7). This is now a bounded CI reliability/supply-chain maintenance task and takes priority over the next gameplay refactor.

Evidence to start from:
- merged source commit for Task 016: `e43c8bede868b509258acfad6f80fdb37266db41`;
- exact green PR head: `c7856c6581d5a43ae904afd7710681af10350dd1`;
- full Validate run: `36557109153` passed syntax, build stamp, structure, all focused regressions, HTTP boot and real `file://` smoke;
- earlier PR log warned that checkout/setup-node v4.4.0 target Node 20 and are being forced onto Node 24;
- current workflow already uses least privilege `permissions: contents: read` and full-length SHA pins; both must be preserved.

## SCOPE

1. Start from fresh `main`; read this task, `AGENTS.md`, `docs/AI_WORKFLOW.md`, `05_GITHUB И КАЧЕСТВО КОДА/03_GITHUB OPERATIONS`, current `.github/workflows/validate.yml`, and the newest Validate log before writing.
2. Check the official `actions/checkout` and `actions/setup-node` repositories/releases at implementation time. Resolve the latest stable Node-24-compatible releases and verify the exact full 40-character commit SHA for each official tag.
3. Update only the first-party Action identities/comments required for this migration. Keep full-SHA pinning; do not replace pins with floating `@v7` refs.
4. Preserve the project's test runtime `node-version: "22"` unless separate evidence proves the game/tooling itself must move. Action runtime and project test runtime are different concerns.
5. Review breaking changes between setup-node v4 and the selected release. The current workflow does not configure registry auth or package-manager cache; do not add package-manager behavior merely because newer setup-node supports it. If the selected action would auto-enable an unused cache, explicitly keep the workflow minimal and deterministic.
6. Preserve triggers, path filters, concurrency, `contents: read`, every syntax/build/structure/regression step, HTTP browser boot and `file://` smoke.
7. Make the workflow change in a dedicated branch/PR. After the first workflow write, stop and inspect the exact PR run/jobs/logs before any further workflow modification.
8. Confirm the old Node-20-forced-to-Node-24 warning is absent on the exact green PR head. If a new warning/failure appears, classify it from the failed step/log and fix the root cause rather than weakening validation.
9. Update `CHANGELOG.md` only if repository policy requires a CI maintenance entry; update the GitHub-quality brains with any reusable migration lesson that is actually confirmed by the run.
10. After verification, merge with expected-head protection. Check exact merged-main Actions when the available GitHub tooling exposes push runs; if the connector still exposes only PR-triggered runs, explicitly mark merged-main push evidence `NOT VERIFIED` rather than inventing it.

## NON-GOALS

- Do not change gameplay, source architecture, assets, balance or AI behavior.
- Do not upgrade the project's test runtime from Node 22 merely because JavaScript Actions themselves now run on Node 24.
- Do not add npm/yarn/pnpm, lockfiles, package caching, dependency installation or a package build system.
- Do not broaden workflow triggers, remove path filters, increase token permissions or disable any validation/smoke step.
- Do not add Dependabot or perform a general CI rewrite in the same pass.
- Do not start the cover/peek extraction in this task.

## INVARIANTS

- Both external first-party actions remain pinned to verified full 40-character commit SHAs with readable release comments.
- `permissions: contents: read` remains unchanged.
- `node-version: "22"` continues to run the repository's JavaScript/test tooling.
- Existing concurrency and source-path trigger policy remain unchanged.
- Every current syntax, build-stamp, structure, focused regression, HTTP boot and `file://` smoke gate remains active.
- The final PR run contains no warning that the selected action release targets removed Node 20.
- No workflow change is accepted merely to obtain a green check; failed logs determine the fix.

## FILES TO INSPECT

- `.github/workflows/validate.yml`
- `AGENTS.md`
- `docs/AI_WORKFLOW.md`
- `CHANGELOG.md`
- `task/README.md`
- relevant GitHub Actions run/jobs/logs
- official `actions/checkout` release/tag source
- official `actions/setup-node` release/tag source
- `05_GITHUB И КАЧЕСТВО КОДА/03_GITHUB OPERATIONS — коммиты, Actions, релизы и профиль`

## VERIFICATION

1. Read the final workflow diff and verify only intended action/version-related lines changed (plus any narrowly justified documentation/changelog).
2. Verify both selected releases against official action repositories and full commit SHAs.
3. Open one PR and inspect the exact Validate run on the exact head SHA.
4. Require all existing jobs/steps to pass, including HTTP Chrome boot and real `file://` menu smoke.
5. Read the job log and explicitly confirm the old Node-20 action-runtime warning is gone.
6. Merge only with an expected-head SHA guard.
7. Verify the exact merged-main push run if tooling exposes it; otherwise record `NOT VERIFIED` with the connector limitation.

## DONE

- checkout/setup-node use current stable Node-24-compatible first-party releases pinned by full SHA;
- no Node-20 action-runtime compatibility warning remains in verified PR CI;
- least privilege, triggers, path filters, concurrency, Node 22 project runtime and every existing quality gate are preserved;
- exact PR head is green and reviewed;
- merged-main evidence is either verified or explicitly marked unavailable/`NOT VERIFIED`; no stronger claim is made;
- this task is removed and exactly one next bounded task is created from fresh evidence.
