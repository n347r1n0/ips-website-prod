#  Шаблон брифа для задач CODEX `docs/codex/TASK__git-preflight-action-postflight.md`

````md
# Задача (CODEX): Preflight → Action → Postflight

> Цель: маленький фиче-PR с корректным заголовком/описанием, открытый автоматически GitHub Action.

## 0) Контекст ветки
- Рабочая ветка: `<подставь>` (например, `feat/mobile-header-actions`)
- Базовая ветка: `main`
- Стиль коммитов: `type(scope): subject` (feat, fix, chore, refactor, docs)

---

## 1) Preflight (перед кодом)
- Проверка состояния:
  ```bash
  git status -sb
  git branch -vv
````

* Если ветка ещё не создана:

  ```bash
  git switch -c <feature-branch>  # например feat/mobile-header-actions
  ```

  Иначе убедись, что ты НА нужной ветке:

  ```bash
  git switch <feature-branch>
  ```
* (Опционально) подтянуть свежий main при старте новой ветки:

  ```bash
  git switch main
  git pull --ff-only origin main
  git switch <feature-branch>
  ```

---

## 2) Action (внесение правок + PR-метаданные)

1. Внеси правки по задаче.
2. Подготовь файлы для авто-PR **в этой же ветке**:

   * `.github/pr.md` — заголовок (первая строка `# type(scope): subject`) и тело PR (см. шаблон ниже)
   * (опционально) `.github/pr-meta.json` — labels/reviewers, например:

     ```json
     { "labels": ["mobile","ui"], "reviewers": ["n347r1n0"] }
     ```
3. Проиндексируй и запушь:

   ```bash
   git add -A
   git commit -m "feat(scope): кратко что и зачем"
   git push -u origin <feature-branch>
   ```

   > ⚠️ Не используй `gh pr create`. PR откроет GitHub Action.

---

## 3) Postflight (проверки и обновления)

* Подожди, пока сработает Action **Auto open/update PR on branch push**.
* Проверь, что PR появился/обновился:

  * вкладка **Pull requests** (фильтр по твоей ветке), или
  * **Actions** → последний ран → лог шага «Create or update PR».
* Если нужно поправить заголовок/описание PR:

  * отредактируй `.github/pr.md` и сделай `git add/commit/push` — Action обновит PR.
* Авто-удаление `.github/pr.*`:

  * В настройках репо включена переменная `CLEANUP_PR_META=true`, Action сам коммитом удалит meta-файлы после открытия PR.

---

## 4) PR body — шаблон (вкладывается в `.github/pr.md`)

```md
# feat(header/mobile): replace section tabs with social actions + big auth

**Почему**
Коротко — зачем эта правка.

**Что сделано**
- Пункт 1
- Пункт 2

**Файлы**
- `path/to/changed/file1`
- `path/to/changed/file2`

**Проверка**
- Шаг 1 (браузер/размер экрана/клик/ожидание)
- Шаг 2

**Примечания**
- Риски / что сознательно не трогаем
- Линкуем связанные задачи/PR
```

---

## 5) Частые ошибки и как избежать

* ❌ Создание PR через `gh`/API → ✅ не нужно: PR откроет Action.
* ❌ Пустой `.github/pr.md` → ✅ тогда заголовок возьмётся из последнего коммита, тело — из fallback.
* ❌ Пуш не в ту ветку → ✅ проверь `git branch -vv`.
* ❌ Большие несвязанные правки в одном PR → ✅ дроби: один смысл — один PR.

````

---

### `.github/pr.md` (примерный шаблон (ты пишешь каждый раз необходимый), кладётся в фиче-ветку)

```md
# feat(header/mobile): replace section tabs with social actions + big auth

**Почему**
Дублирование навигации с колёсиком на мобильных. В шапке хотим оставить социальные экшены + крупную авторизацию.

**Что сделано**
- Header (mobile): ссылки IG/VK/TG channel/TG bot, единый стиль, хиты ≥44px
- Большая иконка auth/profile; логотип кликабелен → #hero
- Desktop-меню не менялось

**Файлы**
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/components/ui/icons/VkIcon.jsx`
- `frontend/src/config/socialLinks.js`

**Проверка**
- Мобильный вьюпорт (iOS/Android): кликабельность кнопок и цвет по токенам
- Переход на `/#hero` по клику на логотип
- Ничего не ломает FloatingChipWheel/AccordionPill

**Примечания**
- Социальные URL — placeholders, заменим на реальные перед релизом
````

---

### `.github/pr-meta.json` (опционально)

```json
{
  "labels": ["mobile", "ui", "ready-for-review"],
  "reviewers": ["n347r1n0"]
}










