# Task 029 — Bound individual CDP command waits

## WHY

Task 028 gives both browser smokes one shared CDP session owner, but fresh review of that owner exposes the next reliability gap: `send(method, params)` still has no per-command response deadline. If Chrome keeps the WebSocket open but stops replying to one command, the promise remains pending until the outer shell `timeout` kills the whole smoke. That loses the failing method/request context and makes CI diagnosis slower than necessary.

## SCOPE

1. Start from fresh `main`; read `AGENTS.md`, `docs/patterns/CDP_SMOKE_SESSION_OWNER.md`, `docs/patterns/BROWSER_RUNTIME_ERROR_ORACLE.md`, `scripts/browser-cdp-session.mjs`, its focused test and both smoke consumers.
2. Add one bounded command-response timeout in `browser-cdp-session.mjs`; keep timeout ownership in the shared session, not in individual consumers.
3. Include useful method/request context in the timeout error without logging secrets or page data.
4. Clear the timer on response, explicit close and socket failure so pending entries/timers cannot leak.
5. Add deterministic fake-WebSocket regressions for a never-responding command and for a normal response that clears its timer.
6. Keep existing outer GitHub Actions `timeout` wrappers as a final process-level safety net.

## NON-GOALS

- No gameplay, UI, asset or balance changes.
- No change to diagnostic severity/classification.
- No browser framework/dependency migration.
- No weakening of HTTP geometry or `file://` generated-art/settings/audio assertions.
- No broad retry loop for arbitrary CDP commands.

## INVARIANTS

- A command that receives a valid CDP response behaves exactly as before.
- A hung command fails with method/request context before the outer shell timeout.
- Response, close and socket-error paths clear pending state exactly once.
- HTTP and `file://` consumers inherit the same command-timeout semantics automatically.
- Warning/fatal diagnostic collection remains independent of command timeout policy.

## FILES TO INSPECT

- `docs/patterns/CDP_SMOKE_SESSION_OWNER.md`
- `docs/patterns/BROWSER_RUNTIME_ERROR_ORACLE.md`
- `scripts/browser-cdp-session.mjs`
- `scripts/browser-cdp-session.test.mjs`
- `scripts/browser-boot-smoke.mjs`
- `scripts/browser-menu-smoke.mjs`
- `.github/workflows/validate.yml`

## VERIFICATION

Node 22 syntax → focused CDP session regression (including hung-command timer) → diagnostic-policy regression → structure/build-stamp gates → real HTTP smoke → real `file://` smoke → exact `main` Actions evidence.

## DONE

A stuck CDP command fails locally in the shared owner with actionable method/request context, timers/pending entries are cleaned deterministically, both browser runtimes retain their current assertions, and CI proves the exact head.
