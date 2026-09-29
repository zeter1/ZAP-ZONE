# Task 010 — Pin Validate action dependencies to immutable SHAs

## Goal

Harden `.github/workflows/validate.yml` supply-chain identity without changing validation behavior: replace movable major tags for GitHub-authored actions with verified full-length commit SHAs.

## Why now / evidence

- Current workflow uses `actions/checkout@v4` and `actions/setup-node@v4`.
- GitHub Secure Use states that a full-length commit SHA is the only immutable release reference for an action.
- Workflow already follows least privilege with `permissions: contents: read`; preserve that and every existing gate.

## Scope

1. Fresh `main`, current task, latest Validate run and exact workflow content.
2. Resolve the intended current checkout/setup-node release tags to full 40-character upstream SHAs.
3. Verify each SHA belongs to the official action repository, not a fork.
4. Replace only the two action refs; keep Node 22, triggers, concurrency, permissions and every validation/smoke step unchanged.
5. Add readable release-tag comments beside pinned SHAs if useful.
6. Run one exact workflow validation cycle and inspect jobs/logs on failure.
7. Delete this task only after exact merged-main evidence; create one evidence-based next task.

## Non-goals

No unrelated dependency upgrades, no new actions, no trigger broadening, no permission expansion, no release/deploy workflow, no gameplay/source refactor.

## Verification

Workflow syntax/intent review → exact diff review → GitHub Actions run on exact head → jobs/failed-step logs if needed → current main SHA/run verification.

## Primary reference

GitHub Docs: Secure use reference — full-length commit SHA is the immutable action reference; verify it comes from the expected action repository.
