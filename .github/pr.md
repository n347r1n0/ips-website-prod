# chore(ci): user-authored auto-PR via PAT; idempotent @codex ping; meta-guard; docs sync

**Why**
- PR должен открываться **от моего аккаунта** (если есть `AUTO_PR_TOKEN`), иначе — ботом.
- Исключаем «снос» описания: если метафайлов нет, **не трогаем** title/body.
- Стабильный Codex-ревью: один пинг с маркером `[[CODEX-REVIEW-PING]]` + `@codex review`.
- Приводим документацию (CODEX.md/AGENTS.md) к текущей дисциплине PR.

**What changed**
- **.github/workflows/auto-open-pr.yml**
  - Concurrency `pr-${{ github.ref }}` + `cancel-in-progress: true`.
  - Два пути создания/обновления PR:
    - **PAT-путь** (`AUTO_PR_TOKEN`) — автор = владелец PAT.
    - **Fallback** (`GITHUB_TOKEN`) — автор = `github-actions[bot]`.
  - `has_meta`-guard: при отсутствии `.github/pr.*` сохраняем существующие title/body.
  - Опциональный клинап метафайлов при `vars.CLEANUP_PR_META == 'true'`.
- **.github/workflows/codex-review.yml**
  - Идемпотентный комментарий-пинг: `[[CODEX-REVIEW-PING]]` + `@codex review`.
  - Запрос ревьюеров из `.github/pr-meta.json.reviewers` **и/или** `vars.CODEX_REVIEWERS`.
  - Node 20 build фронтенда + артефакт `frontend-dist` + короткий bundle-summary.
- **Docs**
  - `CODEX.md`: dual-mode (Full Agent / Chat-only), git-only guardrails.
  - `AGENTS.md`: чек-лист дисциплины PR/веток.

**Files**
- `.github/workflows/auto-open-pr.yml`
- `.github/workflows/codex-review.yml`
- `.github/pr-meta.json` (labels/reviewers; опционально)
- `CODEX.md`, `AGENTS.md`

**How to verify**
1. **Push** в фиче-ветку → ран `Auto open/update PR on branch push` зелёный.
2. Если настроен `AUTO_PR_TOKEN` → PR автор = мой аккаунт; иначе — бот.
3. Title/body = из этого файла. **На последующих пушах без `.github/pr.*` описание не меняется.**
4. Ран `Codex Review Prep` зелёный, лейбл `codex:review` проставлен.
5. В Conversation один комментарий-пинг с `[[CODEX-REVIEW-PING]]` и `@codex review`.
6. В Artifacts есть `frontend-dist`.

**Risk & Rollback**
- Риск: неверный секрет `AUTO_PR_TOKEN` → откат на bot-fallback (PR всё равно откроется).
- Риск: пустой/удалённый `.github/pr.md` → описание сохранится прежним (meta-guard).
- Откат: вернуть предыдущую версию workflow-файла (один коммит), пинги и клинап останутся безопасными.

**Notes**
- Для автозапроса ревьюеров нужны валидные логины-коллабораторы в
  `.github/pr-meta.json.reviewers` **или** `vars.CODEX_REVIEWERS` (через запятую, без `@`).
- `CLEANUP_PR_META=true` удаляет метафайлы **после** успешного открытия/обновления PR по номеру.
