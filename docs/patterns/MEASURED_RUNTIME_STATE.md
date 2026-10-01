# Pattern — measured runtime state → deterministic policy

## Когда читать

Читайте перед изменением поведения, которое зависит от фактического движения, collision result, resolved velocity, grounded/air state, target visibility или другого runtime-факта, производимого соседним subsystem.

## Problem

Опасный anti-pattern: consumer повторно выводит физическое состояние из intent/FSM label (`engage`, `strafe`, `run`) или поддерживает вторую velocity/state переменную. После collision, clipping, acceleration limits или interruption intent уже может не совпадать с тем, что реально произошло.

## Contract

1. Найдите canonical producer измеренного факта после authoritative simulation step.
2. Не переносите физику в policy owner и не создавайте второй source of truth.
3. Передайте measured fact в один semantic owner производного поведения.
4. Derived state допускается только когда ему нужен memory/hysteresis/recovery; owner и lifecycle должны быть явными.
5. Attack/recovery во frame loop рассчитывайте через `dt`, предпочтительно экспоненциальным response `1 - exp(-dt/tau)`, а не fixed «per frame» шагом.
6. Gameplay RNG не используйте для smoothing/derived state. Если existing execution имеет observable RNG order, новый policy должен быть deterministic и не вставлять draws.
7. Safety gates и authoritative effects остаются после policy там же, где были, если задача не меняет их явно.

## ZAP ZONE example

Bot locomotion после collision substeps записывает фактические `velX/velZ` в `src/entities/bots.js`. Fire-control в `src/ai/bot-fire-control.js` потребляет эти значения для movement-aware firing stability; он не угадывает движение по `aiState` или engagement intent.

## Verification pattern

- stationary baseline == previous behavior;
- measured motion cannot improve the relevant stability/safety metric;
- equal speed with harder lateral component produces the documented stronger response, если это часть spec;
- one `dt=T` step ≈ several steps summing to `T` при неизменном target;
- recovery after target drops to zero is gradual and bounded;
- existing RNG call count/order remains unchanged;
- source/structure oracle proves producer → derived owner → consumer ordering where regression risk justifies it.

## AI read set

`task → AGENTS route → owner spec → canonical producer → owner → direct consumer → focused tests`.

Не читать весь repository, если этот read-set уже локализует contract.
