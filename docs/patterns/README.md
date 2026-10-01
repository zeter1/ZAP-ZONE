# Reusable engineering patterns

Короткие reusable contracts для изменений, которые пересекают subsystem boundaries. Это не второй AGENTS.md: открывайте только pattern, который указан текущим task/spec.

- [MEASURED_RUNTIME_STATE.md](MEASURED_RUNTIME_STATE.md) — canonical measured runtime fact → deterministic derived policy → single semantic owner; dt smoothing and RNG-safe composition.

Если pattern перестал совпадать с кодом, current code/tests имеют приоритет, а pattern нужно исправить в той же проходке.
