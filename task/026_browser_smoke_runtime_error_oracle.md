# Task 026 — Fail browser smoke on collected runtime errors

## WHY

Fresh review of `scripts/browser-boot-smoke.mjs` found that the harness collects `Runtime.exceptionThrown`, `console.error` / warning and `Log.entryAdded` diagnostics, but the current `boot === 'ready'` path exits success without inspecting those events. A runtime exception that does not flip the boot dataset could therefore be hidden behind a green HTTP smoke result.

## SCOPE

1. Start from fresh `main`; read `AGENTS.md`, `docs/AI_WORKFLOW.md`, `scripts/browser-boot-smoke.mjs`, the HTTP-smoke workflow block and exact latest Actions evidence.
2. Classify collected CDP events into failure-worthy runtime exceptions/errors versus informational or explicitly expected warnings.
3. Make the ready path fail closed on uncaught runtime exceptions and real console/log errors without turning normal documented warnings into flaky failures.
4. Preserve the existing timeout/CDP diagnostics and geometry smoke assertions; do not suppress or discard useful evidence.
5. Add the smallest deterministic regression for event classification if extracting a pure classifier materially improves testability.

## NON-GOALS

- No gameplay, balance, rendering or asset changes.
- No broad browser-smoke rewrite or new browser dependency.
- No blanket “warnings are errors” rule without evidence.
- No `continue-on-error`, log suppression or catch-and-ignore workaround.

## INVARIANTS

- `boot === 'ready'` is necessary but not sufficient when an uncaught runtime error was observed.
- Known non-fatal warnings remain visible in diagnostics and are not silently deleted.
- HTTP smoke remains deterministic enough for CI and retains bounded timeouts.
- Real failures keep actionable CDP/browser context in the failing log.

## FILES TO INSPECT

- `scripts/browser-boot-smoke.mjs`
- `.github/workflows/validate.yml`
- `src/game/runtime.js` / bootstrap owner only as needed to understand `data-zap-boot`
- any focused smoke test added by the pass

## VERIFICATION

Node 22 syntax → focused event-classification regression if added → HTTP browser boot smoke with no hidden error events → real `file://` menu smoke → exact main Actions evidence.

## DONE

A browser page cannot report HTTP smoke success after the harness observed an uncaught runtime exception or true error, while expected warnings stay diagnosable and exactly one evidence-based next task remains.
