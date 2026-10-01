# CDP smoke session owner

Read this pattern before changing target discovery, WebSocket lifecycle, request/response plumbing, or diagnostic collection shared by the HTTP and direct-`file://` browser smokes.

## Ownership boundary

`scripts/browser-cdp-session.mjs` is the single owner for **CDP transport/session mechanics**:

- polling the configured `/json/list` endpoint within a bounded discovery window;
- preferring a caller-selected page while retaining the existing generic page fallback;
- opening the page WebSocket within a bounded connect window;
- assigning request ids and resolving CDP responses through one pending-request map;
- bounding every individual CDP command wait and clearing its timer on response, send failure, explicit close or socket failure;
- installing diagnostic collection before enabling `Runtime` and `Log`;
- enabling `Runtime` and `Log` exactly once for the session;
- exposing bounded diagnostic/fatal tails and one deterministic `close()` path;
- rejecting unresolved commands when the session closes or the socket fails.

It does **not** own diagnostic severity. `scripts/browser-diagnostic-policy.mjs` remains the only classifier for `Runtime.exceptionThrown`, `Runtime.consoleAPICalled` and `Log.entryAdded`.

It also does **not** own product assertions. `scripts/browser-boot-smoke.mjs` keeps HTTP boot and wall-geometry checks; `scripts/browser-menu-smoke.mjs` keeps `file://` generated-art, real-click, settings and audio assertions.

## Required lifecycle

1. Discover a debuggable page with the caller's preferred URL predicate.
2. Open the page WebSocket and remove connect-only listeners after the connection settles.
3. Attach the shared response/diagnostic message handler.
4. Enable `Runtime` and then `Log` before the consumer can report readiness.
5. Let the consumer issue product-specific CDP commands through `send(...)`; each command gets the same owner-level response deadline (currently 5000ms by default). A timeout reports only method + request id, never params, evaluated page data or secrets.
6. Immediately before success, the consumer checks `hasFatalDiagnostics()` and includes bounded tails on failure/success evidence.
7. Close through the shared session owner; unresolved requests are rejected instead of being left pending.

The order matters. `Log.enable` can emit entries already collected by the browser, so diagnostic listeners must exist before domains are enabled.

## Extraction rule

When two smoke scripts duplicate transport code, extract only mechanics whose semantics are identical. Differences remain explicit caller inputs:

- HTTP target preference: `http://127.0.0.1:8000`;
- local target preference: `file://`;
- caller-specific discovery/WebSocket error wording;
- product-specific polling budgets and assertions.

Do not merge the two smoke scripts just to reduce line count. A shared helper is useful only when it removes a real drift surface without hiding each runtime mode's oracle.

## Regression oracles

Cheap deterministic layer:

`node --test scripts/browser-cdp-session.test.mjs`

It proves:

- preferred target selection wins over generic fallback;
- `Runtime.enable` and `Log.enable` are performed by the shared owner;
- request/response multiplexing preserves method parameters/results;
- a normal response clears its command timer without changing the result;
- a never-responding command fails on the shared bounded deadline with method/request context but without request payload leakage;
- warning and fatal diagnostics are exposed through bounded accessors;
- close/socket-failure paths reject pending commands and clear their timers exactly once; repeated close is idempotent;
- both browser smoke consumers delegate WebSocket transport and diagnostic plumbing to the shared owner.

Integration layer remains authoritative:

- HTTP Chrome/CDP boot smoke;
- direct-`file://` Chrome/CDP menu smoke;
- exact-head GitHub Actions result.

A fake WebSocket test cannot prove Chrome integration, while a browser-only test is too slow and opaque to be the sole owner regression. Keep both layers.

## Review checklist

- One transport/session owner, one diagnostic-policy owner, separate product-specific consumers.
- No `new WebSocket(...)` or duplicated classifier plumbing in smoke consumers.
- No warning suppression or fatal allowlist expansion as part of a transport refactor.
- Connect, discovery and individual command waits stay bounded; total CI shell timeouts remain a final safety net, not the primary diagnostic mechanism.
- Command timeouts belong in the shared session owner so both runtimes gain identical failure semantics. Do not add per-consumer wrappers or automatic retry for arbitrary CDP commands.
- Pending request cleanup is one-shot: response, timeout, explicit close, send failure or socket failure must remove the entry and clear its timer through the same owner path.

## Reading route

`task/*.md` → this pattern → `scripts/browser-cdp-session.mjs` → `docs/patterns/BROWSER_RUNTIME_ERROR_ORACLE.md` → `scripts/browser-diagnostic-policy.mjs` → one concrete smoke → `.github/workflows/validate.yml`.

## Source checkpoint — 2026-10-01

- Chrome DevTools Protocol Runtime domain: https://chromedevtools.github.io/devtools-protocol/tot/Runtime/
- Chrome DevTools Protocol Log domain: https://chromedevtools.github.io/devtools-protocol/tot/Log/
- Node.js 22 global `WebSocket`: https://nodejs.org/download/release/latest-jod/docs/api/globals.html#class-websocket
- Node.js timers / `clearTimeout()`: https://nodejs.org/api/timers.html

Node 22's browser-compatible global `WebSocket` is stable, so this repository does not need a separate WebSocket dependency for the smoke session owner.
