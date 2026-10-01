# Task 030 — Bound CDP diagnostic buffers at collection time

## WHY

Task 029 bounds individual command waits, but fresh review of the same session owner shows a separate retention bug: `diagnosticsTail()` and `fatalDiagnosticsTail()` only slice on read while the backing `events` / `fatalEvents` arrays grow without a cap. A warning/error flood during a slow browser smoke can therefore accumulate memory even though CI only needs a recent diagnostic tail.

## SCOPE

1. Start from fresh `main`; read `AGENTS.md`, `docs/patterns/CDP_SMOKE_SESSION_OWNER.md`, `docs/patterns/BROWSER_RUNTIME_ERROR_ORACLE.md`, `scripts/browser-cdp-session.mjs` and its focused test.
2. Bound diagnostic retention at collection time inside the shared session owner; keep newest entries in chronological order.
3. Preserve `hasFatalDiagnostics()` semantics: once a fatal diagnostic has occurred in the session, later warning traffic or tail eviction must not turn the session green.
4. Keep severity/classification in `browser-diagnostic-policy.mjs`; retention is transport/session policy only.
5. Add deterministic regressions that emit more events than the cap and prove oldest entries are evicted, newest evidence is retained, fatal state remains sticky, and caller-supplied tail limits cannot expose unbounded history.
6. Keep both real HTTP and direct-`file://` Chrome/CDP smokes as integration proof.

## NON-GOALS

- No gameplay, UI, asset or balance changes.
- No diagnostic severity changes or new allowlists.
- No removal of warnings from CI evidence.
- No browser framework/dependency migration.
- No broad log persistence/support-bundle system.

## INVARIANTS

- Diagnostic memory is bounded by the shared session owner, not by each consumer.
- The newest useful evidence is retained in stable chronological order.
- Any observed fatal diagnostic keeps `hasFatalDiagnostics() === true` for the whole session even if the retained fatal tail is capped.
- Existing default output tails remain concise and both browser modes keep identical retention semantics.
- HTTP geometry and `file://` generated-art/settings/audio assertions remain unchanged.

## FILES TO INSPECT

- `docs/patterns/CDP_SMOKE_SESSION_OWNER.md`
- `docs/patterns/BROWSER_RUNTIME_ERROR_ORACLE.md`
- `scripts/browser-cdp-session.mjs`
- `scripts/browser-cdp-session.test.mjs`
- `scripts/browser-boot-smoke.mjs`
- `scripts/browser-menu-smoke.mjs`
- `.github/workflows/validate.yml`

## VERIFICATION

Node 22 syntax → focused CDP session regression with overflow cases → diagnostic-policy regression → structure/build-stamp gates → real HTTP smoke → real `file://` smoke → exact `main` Actions evidence.

## DONE

The shared CDP session cannot grow diagnostic arrays without bound, fatal state cannot be lost through retention, deterministic overflow regressions pass, both concrete smoke oracles stay unchanged, and CI proves the exact head.
