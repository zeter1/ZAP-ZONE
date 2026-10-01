# Browser runtime error oracle

Read this pattern before changing a Chrome DevTools Protocol (CDP) browser smoke, its diagnostic event policy, or the success criteria around `data-zap-boot`.

## Contract

A browser smoke is green only when **both** conditions hold:

1. the product-specific readiness oracle is satisfied (for HTTP boot: `document.documentElement.dataset.zapBoot === "ready"` plus the existing focused runtime assertions);
2. no failure-worthy browser diagnostic was observed before success.

Readiness alone is not proof that the page was healthy. An uncaught JavaScript exception or a real console/log error can leave enough UI/runtime state alive for a naive smoke to report success.

## CDP classification owner

`scripts/browser-diagnostic-policy.mjs` is the single policy owner for diagnostic events consumed by browser smokes.

| CDP event | Level | Smoke policy |
|---|---|---|
| `Runtime.exceptionThrown` | error | **fatal** |
| `Runtime.consoleAPICalled` with `type: "error"` | error | **fatal** |
| `Runtime.consoleAPICalled` with `type: "warning"` | warning | collect + show, non-fatal |
| `Log.entryAdded` with `entry.level: "error"` | error | **fatal** |
| `Log.entryAdded` with `entry.level: "warning"` | warning | collect + show, non-fatal |
| unrelated/info/debug traffic | — | ignore |

Do not duplicate this table as ad-hoc string matching inside individual smokes. A consumer records the formatted diagnostic, separately tracks `fatal === true`, and checks the fatal set immediately before reporting success. Enable both `Runtime` and `Log` before the consumer starts declaring readiness/interactivity so exception, console and browser/network diagnostics share one observation window.

## Session transport owner

`scripts/browser-cdp-session.mjs` owns target discovery, WebSocket lifecycle, request/response multiplexing, Runtime/Log enablement and bounded diagnostic collection for both browser smokes. Read `docs/patterns/CDP_SMOKE_SESSION_OWNER.md` before changing those mechanics. This document and `browser-diagnostic-policy.mjs` still own **severity semantics**; the session helper consumes the classifier but must not grow a second error/warning policy. Product-specific HTTP geometry and direct-`file://` menu/asset assertions remain in their concrete consumers.

## Fail-closed, not warning-hostile

- Unhandled runtime exceptions and true error-level browser diagnostics invalidate a green smoke even when boot already says `ready`.
- Error-level network diagnostics such as a missing runtime asset (HTTP 404) are real failures by default. Fix the URL/resource producer; do not broadly allowlist network errors just to restore green CI.
- Warnings stay visible in the bounded diagnostic tail so CI preserves evidence, but they are not promoted to failures by default.
- Do not solve a noisy error by deleting the listener, swallowing an exception, adding `continue-on-error`, or broadly allowlisting text.
- If a future browser/Three.js warning or error needs special treatment, first prove the producer and user impact. Prefer the narrowest stable classification rule and add a deterministic regression for it.
- Keep diagnostic output bounded (currently the last 30 collected events and last 10 fatal events) so failures stay actionable without flooding CI logs.

## Regression oracle

The cheap deterministic layer is `node --test scripts/browser-diagnostic-policy.test.mjs`. It must prove that:

- an uncaught runtime exception is fatal and retains location/message context;
- console/log errors are fatal;
- console/log warnings are observable but non-fatal;
- unrelated CDP traffic cannot turn the smoke flaky.

The browser layer remains authoritative for wiring: both current consumers — `scripts/browser-boot-smoke.mjs` over HTTP and `scripts/browser-menu-smoke.mjs` over direct `file://` — use the same policy and must pass their real Chrome/CDP smoke. A change to either consumer requires the corresponding real browser run; a shared-policy change requires both.

Mutation question: if `console.error` or `Runtime.exceptionThrown` were accidentally reclassified as non-fatal, the focused policy regression must fail.

## Reading route

`task/*.md` → `docs/patterns/CDP_SMOKE_SESSION_OWNER.md` for transport/lifecycle → this pattern for severity → `scripts/browser-diagnostic-policy.mjs` → the concrete smoke consumer → `.github/workflows/validate.yml`.

Do not read gameplay owners unless the browser evidence points to a gameplay/runtime defect.

## Source checkpoint — 2026-10-01

- Chrome DevTools Protocol Runtime domain: https://chromedevtools.github.io/devtools-protocol/tot/Runtime/
- `Runtime.exceptionThrown`: https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#event-exceptionThrown
- `Runtime.consoleAPICalled`: https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#event-consoleAPICalled
- Chrome DevTools Protocol Log domain: https://chromedevtools.github.io/devtools-protocol/tot/Log/
