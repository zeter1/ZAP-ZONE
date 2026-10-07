# Documentation map — ZAP ZONE

Цель: быстро выбрать **минимальный правильный read-set**. Не читать весь `docs/` механически.

## Начать отсюда

- Общая AI/Codex работа: `../AGENTS.md` → `AI_WORKFLOW.md`.
- Архитектурные boundaries/owners: `ARCHITECTURE.md`.
- Runtime asset contracts: `ASSETS.md`.
- Blender / GLB / 3D authoring + transfer: `BLENDER_ASSET_PIPELINE.md`.
- Текущая bounded задача: `../task/README.md` + один нужный `task/*.md`.

## Assets

### Blender / 3D
Read-set:
`BLENDER_ASSET_PIPELINE.md → asset-staging/<pack>/README.md → owner code → focused tests`.

Для текущих объёмных ботов:
`BLENDER_ASSET_PIPELINE.md → specs/BOT_PRESENTATION.md → ../asset-staging/2026-10-06-bot-3d-pack-46/README.md → ../src/entities/bot-model3d.js → ../src/entities/bot-presentation.js`.

Для modular map Pack47:
`BLENDER_ASSET_PIPELINE.md → ASSETS.md#модульный-sci-fi-environment--pack47 → ../asset-staging/2026-10-07-map-sci-fi-kit-47/README.md → ../src/environment/map-kit3d.js → ../src/core/engine.js → ../scripts/map-kit47-owner.test.mjs`.

### Generated raster / WebP / SVG / VFX
Read-set:
`ASSETS.md → конкретный asset-staging/<pack>/README.md|manifest → consumer owner → focused asset/presentation test`.

Не применять DOM/raster правила к Blender mesh автоматически и наоборот.

## Bot AI

- Level/kills/stat scaling: `specs/BOT_PROGRESSION_SCALING.md`
- Perception/threats: `specs/BOT_PERCEPTION.md`
- Damage reaction: `specs/BOT_DAMAGE_REACTION.md`
- Suppression: `specs/BOT_SUPPRESSION_RESPONSE.md`
- Dodge: `specs/BOT_DODGE_RESPONSE.md`
- Navigation/collision: `specs/BOT_NAVIGATION.md`
- Positioning: `specs/BOT_POSITIONING.md`
- Cover execution: `specs/BOT_COVER_EXECUTION.md`
- Engagement movement: `specs/BOT_ENGAGEMENT_MOVEMENT.md`
- Weapon choice: `specs/BOT_WEAPON_POLICY.md`
- Fire execution: `specs/BOT_FIRE_CONTROL.md`
- Cadence/retry: `specs/BOT_FIRE_CADENCE.md`
- Deployables: `specs/BOT_DEPLOYABLES.md`
- State priority: `specs/BOT_STATE_POLICY.md`
- Visual body/rig/IK: `specs/BOT_PRESENTATION.md`

## Objective / combat

- Frontline: `specs/FRONTLINE.md`
- Projectile ricochet: `specs/PROJECTILE_RICOCHET.md`

## Reusable engineering patterns

- Browser/CDP session ownership: `patterns/CDP_SMOKE_SESSION_OWNER.md`
- Browser runtime diagnostics: `patterns/BROWSER_RUNTIME_ERROR_ORACLE.md`
- Measured post-physics facts: `patterns/MEASURED_RUNTIME_STATE.md`
- Combined fire stability: `patterns/COMPOSED_FIRE_STABILITY.md`
- Outcome-driven cadence/retries: `patterns/OUTCOME_DRIVEN_CADENCE.md`
- Wall/occlusion presentation parity: `patterns/OCCLUSION_CONSISTENT_PRESENTATION.md`
- Pattern index: `patterns/README.md`

## Verification routing

### Docs-only
Check:
- target paths exist;
- links point to current owners;
- no stale owner/fallback/runtime statements;
- `git diff --check`;
- `node scripts/validate-structure.mjs` if the docs describe a structure contract already enforced by it.

### Blender/3D source
Follow `BLENDER_ASSET_PIPELINE.md` verification ladder:
rebuild → Blender preview → focused model/rig tests → structure → build stamp → full tests → HTTP proof → direct `file://` proof.

### Source/runtime JS
At minimum:
syntax → focused tests → build stamp → structure → browser smoke.

### GitHub
Before writes read the GitHub operations knowledge required by project instructions and inspect workflow triggers. Do not create unnecessary Actions runs.

## Documentation ownership rule

Do not copy the same facts everywhere.

- `docs/README.md` — navigation only.
- `AGENTS.md` — compact AI owner map.
- `AI_WORKFLOW.md` — workflow + verification routing.
- `ARCHITECTURE.md` — system boundaries/semantic ownership.
- `ASSETS.md` — integrated runtime asset contracts.
- `BLENDER_ASSET_PIPELINE.md` — reusable Blender/export/Three.js pipeline.
- `specs/*.md` — narrow behavior/owner invariants.
- `patterns/*.md` — reusable engineering pattern.
- `asset-staging/<pack>/README.md` — exact pack provenance, hashes, rebuild/evidence.
- `CHANGELOG.md` — project/user-visible change history.

When a fact changes, update the **smallest canonical level** that owns it and only the routing references that would otherwise become misleading.

## Staleness traps

Before relying on old docs, verify current code for:
- classic-script load order;
- `file://` cache/build behavior;
- active asset pack/fallback;
- bot model owner vs hit-mesh owner;
- current test counts/build hashes;
- current Blender/builder artifact hashes.

Current code and verified runtime evidence win over old documentation.
