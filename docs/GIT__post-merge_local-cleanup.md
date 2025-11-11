Маленькая памятка и скрипт для быстрой **уборки локальных веток**, уже слитых в базовую (обычно `main`), после мержа PR.

# Post-merge cleanup (Windows/PowerShell) — **шпаргалка**

> ℹ️ У нас на GitHub включено **авто-удаление удалённых веток** после слияния. Этот скрипт чистит **только локальные** ветки.

**Алиасы уже заданы в `.git/config`:**

* `git gclean` → `frontend/scripts/git-clean-merged.ps1 -IncludeGone`
* `git clean-merged` → то же самое
* `git gclean-dry` → `frontend/scripts/git-clean-merged.ps1 -IncludeGone -DryRun`

> `-IncludeGone` уже зашит в алиасы — **не добавляй его второй раз**.

---

## TL;DR (самое частое)

```powershell
# Предпросмотр (ничего не удаляет)
git gclean-dry

# Безопасная чистка (только полностью слитые ветки)
git gclean

# Форс-чистка (для squash-мержей и «зависших» веток)
git gclean -Force
```

---

## Типовые цели → команда

* **Посмотреть, что удалится (dry-run):**

  ```powershell
  git gclean-dry
  ```
* **Удалить всё, что гарантированно слито в `main`:**

  ```powershell
  git gclean
  ```
* **После squash-merge, удаляется только с форсом:**

  ```powershell
  git gclean -Force
  ```
* **Базовая ветка не `main`, а, например, `dev`:**

  ```powershell
  git gclean -Base dev
  ```
* **Не переключаться на базовую ветку (остаться на текущей):**

  ```powershell
  git gclean -NoSwitch
  ```
* **Сохранить определённые ветки (глоб-шаблоны):**

  ```powershell
  git gclean -Keep 'wip/*','chore/ci-*'
  ```
* **Вывести результат в JSON (для скриптов):**

  ```powershell
  git gclean -Json
  ```

---

## Как это работает (кратко)

1. Переключается на базовую ветку (`main` по умолчанию) и подтягивает её без мерджа.
2. `git fetch --prune` — чистит удалённые tracking-ветки.
3. Ищет локальные ветки, **слитые** в базовую, и ветки с upstream **[gone]**.
4. Удаляет:

   * безопасно (`-d`) — по умолчанию;
   * форсом (`-D`) — при `-Force`.

---

## Подсказки

* Запускать из **корня репозитория**.
* Форс (`-Force`) используй, когда уверен, что PR слит (типичный случай после **squash-merge**).
* Скрипт чистит **только локальные** ветки. На GitHub удаление уже включено автоматически после merge.

---

Если вдруг нужно без алиаса (редко), прямой вызов:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File frontend/scripts/git-clean-merged.ps1 -IncludeGone [-DryRun|-Force|-Base main|-NoSwitch]
```

