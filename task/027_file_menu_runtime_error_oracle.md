# Task 027 — Apply the runtime-error oracle to the file:// menu smoke

## WHY

Task 026 made the HTTP boot smoke fail closed on shared CDP fatal diagnostics. Fresh review of `scripts/browser-menu-smoke.mjs` shows that the real `file://` menu smoke still enables only `Runtime` responses and does not collect `Runtime.exceptionThrown`, console error/warning or `Log.entryAdded`. The menu can therefore become interactive and satisfy asset/click assertions while an unrelated uncaught runtime error remains invisible.

## SCOPE

1. Start from fresh `main`; read `AGENTS.md`, `docs/AI_WORKFLOW.md`, `docs/patterns/BROWSER_RUNTIME_ERROR_ORACLE.md`, the shared diagnostic policy and `scripts/browser-menu-smoke.mjs`.
2. Reuse `scripts/browser-diagnostic-policy.mjs`; do not fork classification rules into the file smoke.
3. Enable the required CDP domains and collect bounded formatted diagnostics while preserving response handling.
4. Before the file smoke reports success, fail closed if any shared-policy fatal diagnostic was observed.
5. Keep warnings visible but non-fatal and preserve all existing generated-asset, settings-modal, real-click and audio-load assertions.

## NON-GOALS

- No gameplay, balance, rendering or asset changes.
- No second diagnostic classifier.
- No blanket warnings-as-errors policy.
- No weakening/removal of the current real-click or generated-asset assertions.
- No new browser dependency or broad smoke rewrite.

## INVARIANTS

- `file://` interactivity is necessary but not sufficient when a fatal browser diagnostic occurred.
- HTTP and file smokes share one CDP diagnostic policy.
- Warnings remain bounded, visible evidence without becoming flaky failures.
- Existing menu/asset/audio assertions retain their current semantics and time bounds.

## FILES TO INSPECT

- `docs/patterns/BROWSER_RUNTIME_ERROR_ORACLE.md`
- `scripts/browser-diagnostic-policy.mjs`
- `scripts/browser-menu-smoke.mjs`
- `.github/workflows/validate.yml`

## VERIFICATION

Node 22 syntax → shared diagnostic-policy regression → real `file://` Chrome/CDP menu smoke → HTTP boot smoke regression → structure/build-stamp gates → exact `main` Actions evidence.

## DONE

The local-file menu smoke cannot report success after the shared policy observed an uncaught runtime exception or true console/log error, warnings stay diagnosable, existing menu assertions remain intact, and exactly one evidence-based next task remains.
