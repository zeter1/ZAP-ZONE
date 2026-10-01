# task/ — очередь инженерных проходок

Эта папка хранит только небольшие **pending** задачи для следующего диалога. `README.md` — инструкция, не задача.

Правила:
- 1 задача = 1 `.md`;
- следующая проходка начинает с task с наименьшим номером; по умолчанию держать ровно одну pending gameplay/engineering задачу, чтобы не размывать качество;
- выполненную задачу удалить в той же проходке;
- новая задача появляется только из фактов свежего `main`, review, CI или runtime evidence;
- задача должна иметь: WHY, SCOPE, NON-GOALS, INVARIANTS, FILES TO INSPECT, VERIFICATION, DONE;
- не читать весь проект: сначала `AGENTS.md` → `docs/AI_WORKFLOW.md` → owner/spec → точечный код;
- чистый refactor не должен незаметно менять gameplay balance;
- после source/runtime change обязательны build stamp, structure validation и browser smoke;
- GitHub writes собирать в минимальное число логических commits и проверять Actions после записи;
- randomized policy extraction обязана фиксировать short-circuit и точный RNG call count/order, если они наблюдаемы в gameplay.
