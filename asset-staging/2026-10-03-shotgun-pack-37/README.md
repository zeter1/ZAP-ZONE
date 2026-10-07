# Shotgun Pack37

Пользователь явно запросил генерацию и интеграцию дробовика. Built-in image_gen
создал action/effects/pickup. Первый action кандидат отклонён из-за бокового
среза руки; активный source перегенерирован и проверен в настоящем игровом DOM.
Нет нового платного API/внешних downloads. Все три active PNG сохранены рядом.

Canonical runtime contract: ../../docs/ASSETS.md (раздел Дробовик — Pack37).
Manifest хранит точную source→runtime карту, fit, gutters, sequences, alpha,
размеры, bytes/budget и SHA256. Frame0 используется ready и концом sequences.
Гильза отдельная и отсутствует в action-source. Effects row0 muzzle, row1 smoke,
row2 реальная дробь, row3 spent shell. Pickup source даёт world art и HUD icon.
Обычные surface hits используют уже имеющийся impact29, без дублирования.

Consumer/event/fallback: system ready/action после emitted shot или shell reload,
matching ready hold при отказе atlas, legacy01/pump25 затем procedural rig;
settings muzzle/smoke/casing после события и decode; combat projection следует
реальной дробине. World pickup использует существующий procedural fallback.
Звуки выстрела/помпы/shell/load созданы локальным детерминированным синтезом,
22.05kHz mono16-bit PCM, без клиппинга; поддержка file остаётся WebAudio synth.

Точные prompts — prompts.json. Build-assets.py работает только в этом root и
пересобирает девять owned runtime derivatives; сырые source не перезаписывает.
После пересборки обязательны stamp/check, structure и shotgun owner tests.
Browser evidence и границы — VERIFICATION.md.
