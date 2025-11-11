# docs: remove legacy frontend/CODEX.md & refresh git cleanup memo

## What
- Remove legacy `frontend/CODEX.md` (исторический файл — больше не используется).
- Refresh memo for post-merge local branch cleanup (актуальная шпаргалка под мои алиасы):
  - `git gclean-dry` — предпросмотр
  - `git gclean` — безопасная чистка
  - `git gclean -Force` — форс (после squash-merge)
  - доп. параметры: `-Base`, `-NoSwitch`, `-Keep`, `-Json`

## Why
- Свести источники правды к актуальным системным докам в корне (AGENTS.md / CODEX.md).
- Сделать локальную уборку веток предсказуемой и быстрой (шпаргалка под существующие алиасы).

## Scope guard
- ✅ Только docs: удаление `frontend/CODEX.md` и обновлённый md с памяткой.
- ✅ Без изменений в `frontend/src/**`, `supabase/**`, configs/build/CI.
- ✅ Под авто-PR триггер (`docs/**`).

