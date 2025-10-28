# Post-merge local cleanup (Windows/PowerShell)

Маленькая памятка и скрипт для быстрой **уборки локальных веток**, уже слитых в базовую (обычно `main`), после мержа PR.

> ℹ️ У нас на GitHub включено **авто-удаление удалённых веток** после слияния. Этот скрипт чистит **только локальные** ветки.

---

## TL;DR

```powershell
# безопасная чистка веток, полностью слитых в main
pwsh -File scripts/git-clean-merged.ps1 -Base main

# если часто используешь squash-merge и хочешь форс-удаление:
pwsh -File scripts/git-clean-merged.ps1 -Base main -Force
```

---

## Что делает скрипт

Файл: `scripts/git-clean-merged.ps1`

1. Переключается на базовую ветку (`git switch $Base`) и подтягивает её (`git pull --ff-only`).
2. Очищает устаревшие remote-tracking ветки (`git fetch --prune`).
3. Находит **локальные** ветки, полностью слитые в `$Base` (`git branch --merged $Base`).
4. Отфильтровывает «защищённые» (например, `main`, `dev`, `develop`) и текущую ветку.
5. Удаляет остальные:

   * по умолчанию **безопасно** (`git branch -d`) — только если ветка полностью слита,
   * с флагом `-Force` — **форс** (`git branch -D`), полезно при squash-merge.

---

## Требования

* Windows + PowerShell (`pwsh`).
* Запускать из корня репозитория.
* Чистый рабочий каталог (желательно): без незакоммиченных изменений.

---

## Использование

```powershell
# базовая ветка main (по умолчанию); безопасный режим
pwsh -File scripts/git-clean-merged.ps1

# явно указать базовую ветку
pwsh -File scripts/git-clean-merged.ps1 -Base main

# форс-удаление (для веток, слитых через squash-merge)
pwsh -File scripts/git-clean-merged.ps1 -Base main -Force
```

### Удобный алиас (опционально)

```powershell
git config alias.clean-merged '!pwsh -File scripts/git-clean-merged.ps1'
# теперь достаточно:
git clean-merged
```

---

## Настройки и кастомизация

* **Защищённые ветки**: в скрипте массив

  ```powershell
  $protected = @($Base, 'dev', 'develop')
  ```

  Добавь сюда свои («не удалять ни при каких условиях»).

* **Удаление**:

  * `-d` — безопасно, только полностью слитые ветки;
  * `-D` — форс, используется при параметре `-Force`.

* **Prune**: `git fetch --prune` уже делает то, что и `git remote prune origin`; отдельная команда **не нужна**.

---

## Частые вопросы

**Q: Удаляет ли скрипт ветки на GitHub?**
A: Нет. У нас включено авто-удаление **удалённых** веток после мержа PR. Скрипт чистит **только локальные**.

**Q: Почему моя ветка не удаляется с `-d`?**
A: Скорее всего, это был **squash-merge** — история не совпадает. Запусти с `-Force` (использует `-D`).

**Q: Опасно ли запускать `-Force`?**
A: Он удаляет локальные ветки **даже если Git считает, что они не слиты**. Используй осторожно (только когда уверен, что PR слит).

---

## Типичный рабочий поток

1. Мёрджим PR в `main` (ветка на GitHub удалится автоматически).
2. Локально запускаем:

   ```powershell
   pwsh -File scripts/git-clean-merged.ps1 -Base main
   ```
3. Если были squash-мерджи и какие-то ветки остались:

   ```powershell
   pwsh -File scripts/git-clean-merged.ps1 -Base main -Force
   ```

---

## Пример вывода

```
Candidates to delete:
  feature/floating-chip-wheel
  fix/calendar-header
✅ Local cleanup done.
```
