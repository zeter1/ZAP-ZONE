# Проверка дробовика Pack37

Сборка47f5c068a8331206. Проверки на изолированной копии с отдельным Chromium
context: пользовательские localStorage/profile и сохранения не использовались.

VERIFIED:172/172 owner regressions;9 shotgun tests проходят через реальные
producer и hit owner; syntax, structure, stamp/check. Независимый verifier:
22/22 focused/neighbor tests, shared feedback, four active/effects combinations,
flight occlusion/cleanup/reused pooled mesh, все12 игровых кадров рук.

Browser: native PointerLock/LMB, один патрон→8 дробин с одним shared feedback;
shot/pump, R→LMB, empty+limited reserve, R→switch с настоящим owned ammo,
R→pause→resume. Real THREE camera→wall ray до исправления попадал на.35м,
ray из старого spawn внутри стены не находил грань; после исправления spawn
остаётся перед стеной и ближайшая грань находится на.03м.
Все6 action cells проверены в игровом DOM при1920×1080 и1280×960.

HTTP boot и direct-file menu/parity smoke PASS. Fault injection: отсутствие
action/effects/ready, обоих ready и неверные dimensions; reload всё равно
завершается с правильными патронами. Procedural fallback вспышка измерена
синхронно внутри native mousedown, opacity.72 и lifetime.075s. Первоначальный
поздний snapshot дал ноль уже после окончания эффекта; это не доказательство
потери вспышки. Фолбэк-проверка исправлена измерением момента emission.

NOT_VERIFIED: субъективное звучание на пользовательском устройстве,
долгий бой при высокой нагрузке, HTTPS/uCoz/GitHub/remote CI. Local WAV
формат, ненулевой сигнал и отсутствие клиппинга подтверждены byte-oracles;
прямой file использует существующий synth fallback.

Ручная проверка: слот2, выстрел у стены и краем дробового конуса по противнику;
R→ЛКМ, R→смена, R→пауза→продолжить. При сбое нужны build/version.json,
короткая запись, размер окна и Console/Network.
