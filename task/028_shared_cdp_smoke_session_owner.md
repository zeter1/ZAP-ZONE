# Task 028 — Extract one shared CDP smoke-session owner

## WHY

Task 027 closed the diagnostic-policy drift, but code review now shows a second drift surface: `scripts/browser-boot-smoke.mjs` and `scripts/browser-menu-smoke.mjs` still duplicate page discovery, WebSocket opening, request-id/pending response plumbing, `send(...)`, Runtime/Log enablement and diagnostic collection. That duplication is the direct structural reason the HTTP smoke gained the fatal-error oracle one pass before the `file://` smoke.

## SCOPE

1. Start from fresh `main`; read `AGENTS.md`, `docs/AI_WORKFLOW.md`, `docs/patterns/BROWSER_RUNTIME_ERROR_ORACLE.md`, both browser smokes and the shared diagnostic policy.
2. Extract the smallest shared helper under `scripts/` for CDP session mechanics only: target-page discovery, bounded WebSocket connection, request/response multiplexing, Runtime + Log enablement, shared diagnostic collection and deterministic close/fatal-tail access.
3. Keep product-specific assertions in their current consumers: HTTP boot/wall geometry stays in `browser-boot-smoke.mjs`; generated-art/menu-click/audio assertions stay in `browser-menu-smoke.mjs`.
4. Preserve target selection differences (`http://127.0.0.1:8000` vs `file://`) and current timeout/error wording where useful.
5. Add the smallest deterministic regression for helper lifecycle/diagnostic ownership if it can be done without a real browser; real Chrome/CDP smokes remain the integration oracle.

## NON-GOALS

- No gameplay, balance, UI or asset changes.
- No browser dependency/framework migration.
- No merge of the two product-specific smoke scripts.
- No duplicate diagnostic classifier.
- No suppression/allowlist expansion.

## INVARIANTS

- Exactly one semantic owner for diagnostic classification remains `browser-diagnostic-policy.mjs`.
- Shared session code cannot make either smoke less strict.
- Fatal diagnostics are checked before success in both consumers.
- Warnings remain bounded/visible and non-fatal.
- Existing HTTP geometry and `file://` generated-art/settings/audio assertions keep their current semantics and budgets.

## VERIFICATION

Node 22 syntax → focused helper/policy regression → structure/build-stamp gates → real HTTP Chrome/CDP smoke → real `file://` Chrome/CDP smoke → exact `main` Actions evidence.

## DONE

Both smokes delegate CDP transport/session mechanics to one small tested owner, keep their domain-specific assertions local, and exact-head CI proves both browser runtimes still pass.
