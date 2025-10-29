# 1) `AGENTS.md`

````md
# AGENTS.md — Code Review Guidelines (IPS repos)

**Repos & roles**
- **PROD:** `ips-website-prod` — главный целевой код. Визуал и UX **нельзя ухудшать**.
- **DEV:**  `ips-ui-lab` — архитектурные образцы (tokens, surfaces, patterns). DEV — обычно read-only.

**Runtime modes (см. CODEX.md)**
- *Full Agent:* разрешены только git-команды (status/switch/branch/add/commit/push) внутри карт маппинга.
- *Chat-only:* через batched read; маленькие обратимые патчи.

---

## P0 — Blockers (отказ PR)
- ❌ Любые изменения deps/build/config/CI, миграций/edge (`package.json`, `vite.config.*`, `tailwind.config.*`, `postcss.config.*`, `index.html`, workflows за пределами согласованных правок).
- ❌ Визуальное ухудшение в PROD: цвет/контраст, радиусы, тени, spacing, жесты/скролл.
- ❌ Широкие переименования/расширение селекторов без пошагового плана и fallback.
- ❌ Ломка а11y: нет видимого focus, низкий контраст, некорректные aria-атрибуты.
- ❌ Смешение крупных несвязанных задач в одном PR.

## P1 — Must-fix до merge
- Заголовок PR — Conventional Commit (`type(scope): subject`).
- Весь “жёсткий” стиль → **только токены/var(...)** (никаких hex/rgba в изменённых блоках).
- **CSS import-порядок (строгий)** в `index.css`:
  1) `@import './ui/tokens.css'`,
  2) `@tailwind base; @tailwind components;`,
  3) `@import './styles/*.css'` (каждый под `@layer components`),
  4) `@tailwind utilities;`.
- Для новых реализаций — **safe switch** (проп/фича-флаг), legacy по умолчанию.
- Для модалок/панелей: Header/Body/Footer, `overflow-y:auto; min-height:0; scrollbar-gutter: stable both-edges`.
- Консоль чистая; сборка зелёная; нет лишних логов.

## P2 — Should-fix/Ниты
- Одно назначение — один PR; избыточные правки вынести отдельно.
- Мелкие утилити-классы вместо inline-стилей; повторяемые значения → токены.
- Ровный вертикальный ритм; без “прыгающего” box-model на hover (меняем только цвет/opacity/shadow).

---

## Что проверять по файлам
- **Surfaces/Patterns:** извлечены из ad-hoc в переиспользуемые слои (`styles/*.css` под `@layer components`), вид **идентичен** PROD.
- **Navigation/Home:** активные стейты, клики/скролл не конфликтуют; если добавлен новый виджет (например, колесо) — только через флаг.
- **Auth/UI:** иконки/цвета из токенов; aria-label на икон-кнопках ≥44px hit-area.
- **Performance:** без лишних re-render; массивы зависимостей хуков полные; отсутствуют синхронные тяжёлые вызовы в render.

---

## PR-описание (требования к `.github/pr.md`)
- **Why / Что сделано / Файлы / Проверка / Примечания.**
- Список изменённых путей и минимальные шаги валидации.  
- Если PR открыт экшеном — тело должно сохраниться (guard в CI есть).

---

## Как давать фидбек
- **Blocker:** коротко “почему” + конкретный пункт выше + мини-патч/сниппет.
- **Must-fix:** список конкретных строк/файлов + предложенные замены (diff-блоки).
- **Nits:** сгруппировать, не блокировать merge.

**Формат мини-патча (пример)**
```diff
- bg-[rgba(255,255,255,0.6)]
+ bg-[var(--panel-bg)]
````

---

## Ссылки

* Детальные правила и процесс: `CODEX.md`
* Шаблон рабочего брифа: `docs/codex/TASK__git-preflight-action-postflight.md`
