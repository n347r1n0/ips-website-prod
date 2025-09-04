# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.







# IPS Website — README

> Статический SPA (Vite/React) + Supabase (DB/Auth/Edge Functions). Прод-хостинг — GitHub Pages с кастомным доменом `https://www.ipokerstyle.com`.
> Надёжная аутентификация (Email/Password и Telegram), календарь турниров, админ-инструменты, профиль/рейтинг, и **устойчивость к iOS Safari background-сценариям**.

---

## 1) Overview

* **Фронтенд:** React (Vite, Tailwind, React Router), единый Supabase JS-клиент, утилиты `validatedStorage`, `iosSafariUtils`, `sessionUtils`.
* **Бэкенд:** Supabase (Postgres, GoTrue Auth) + Edge Function `telegram-auth-callback` (Deno/TypeScript) для Sign in with Telegram.
* **Хостинг:** GitHub Pages (SPA-режим `index.html` + `404.html`) с CNAME `www.ipokerstyle.com`.

---

## 2) Архитектура (словами + диаграмма)

**Потоки аутентификации**

* **Email/Password:** `supabase.auth.signInWithPassword()` → сессия.
* **Telegram:** Telegram Widget → возвращает payload → **Edge Function** (`telegram-auth-callback`)
  → верификация HMAC/свежести → password grant → возвращаем `access/refresh` → `supabase.auth.setSession()`.

**Диаграмма (упрощённо)**

```
[Browser: React SPA]
   |           ^      \     (Auth state)
   v           |       \-------------------------------.
[Telegram Widget]       \                              |
   | onAuth payload      \  supabase-js (GoTrue/Auth)  |
   v                      \     ↑        ↓              |
[Edge Function: telegram-auth-callback] -> [Supabase Auth] -> [DB + RLS]
   |  (HMAC verify, password grant, user create if needed)
   '--> tokens ---> SPA setSession() -> verified session -> UI
```

---

## 3) Технологии

* **Frontend:** React + Vite, Tailwind, React Router; контексты/Auth; утилиты:

  * `validatedStorage`: фильтрует/чистит «битые» sb-\* токены, надёжный logout.
  * `iosSafariUtils`: детект iOS Safari, маркеры/валидаторы контекста, «рефреш» после бэкграунда.
  * `sessionUtils`: надёжная установка сессии (повторные попытки invoke, подтверждение setSession).
* **Backend:** Supabase (Postgres, GoTrue), Edge Function (Deno) `telegram-auth-callback`.
* **CI/CD:** GitHub Actions → Pages. SPA fallback (`404.html`), CNAME.

---

## 4) Структура репозитория (ключевое)

```
ips-website/
├─ frontend/
│  ├─ src/
│  │  ├─ components/features/Auth/
│  │  │  ├─ TelegramLoginWidget.jsx
│  │  │  └─ TelegramLoginRedirect.jsx
│  │  ├─ contexts/
│  │  │  └─ AuthContext.jsx
│  │  ├─ pages/
│  │  │  └─ TelegramCallbackPage.jsx
│  │  ├─ lib/
│  │  │  ├─ supabaseClient.js
│  │  │  ├─ validatedStorage.js
│  │  │  ├─ iosSafariUtils.js
│  │  │  └─ sessionUtils.js
│  │  └─ ui/, components/..., hooks/...
│  ├─ public/
│  │  └─ tg-mobile-test.html
│  ├─ index.html
│  └─ vite.config.js
└─ supabase/
   ├─ functions/
   │  └─ telegram-auth-callback/
   │     └─ index.ts
   └─ migrations/
```

---

## 5) Быстрый старт (локально)

**Требования:** Node 20+, npm, Supabase проект.

1. Создайте `frontend/.env.local`:

```env
VITE_SUPABASE_URL=...             # из вашего Supabase Project Settings
VITE_SUPABASE_ANON_KEY=...        # anon public key

# Telegram bot
VITE_TELEGRAM_BOT_USERNAME=IPS_TheRightMove_bot   # username без @
VITE_TELEGRAM_BOT_ID=8034843044                   # numeric bot_id (не удалять)

# (опционально) HMR host для dev
VITE_PUBLIC_HOST=localhost:5173
```

2. Установите зависимости и запустите:

```bash
cd frontend
npm ci
npm run dev
```

3. Откройте `http://localhost:5173`.

> В коде **всегда** импортируйте Supabase из `@/lib/supabaseClient` (единый клиент). Не создавайте дубликаты.

---

## 6) Переменные окружения

### Frontend (`.env.local`, `.env.production`)

* `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
* `VITE_TELEGRAM_BOT_USERNAME` (username без `@`)
* `VITE_TELEGRAM_BOT_ID` (**numeric**, не удалять — нужен для диагностики/прямых OAuth кейсов)
* `VITE_PUBLIC_HOST` (для dev/HMR)

### Edge Function `telegram-auth-callback` (через Supabase Dashboard → Functions → Env Vars)

* `SUPABASE_URL`
* `SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* `TELEGRAM_CLIENT_SECRET` (Bot Token)
* `SHADOW_PASSWORD_SECRET` (соль для deterministic password grant)
* (опц.) `DEBUG_TELEGRAM_BYPASS=true` для локальной отладки (не в прод).

---

## 7) CORS, Redirect URLs, домены

### CORS в Edge Function (`index.ts`)

```ts
const ALLOW_ORIGINS = [
  'https://www.ipokerstyle.com',
  'https://ipokerstyle.com',
  'https://www.ipoker.style',
  'https://ips-entertain.xyz',
  'https://www.ips-entertain.xyz',
  'https://n347r1n0.github.io',   // «паспорт» GitHub Pages
  'http://localhost:5173',
];
```

### Supabase → Authentication → URL Configuration

**Redirect URLs** включают:

* `https://www.ipokerstyle.com`
* `https://www.ipokerstyle.com/auth/telegram/callback`
* `https://www.ipoker.style` (если используется)
* `https://ipokerstyle.com`
* `https://n347r1n0.github.io/ips-website/`
* `https://n347r1n0.github.io/ips-website/auth/telegram/callback`
* `http://localhost:5173`
* `http://localhost:5173/reset-password`
* (и другие актуальные страницы типа `/reset-password`)

> Причина добавления `github.io`: в некоторых OAuth-ветках/редиректах может «просвечивать» базовый адрес GitHub Pages. Он должен быть whitelisted.

---

## 8) Детали аутентификации

### Email/Password

* Стандартный GoTrue. После регистрации триггер создаёт запись в `public.club_members`.

### Telegram

* **Widget** (`TelegramLoginWidget.jsx`) — используем режим `data-onauth` (мгновенный UX), при необходимости `TelegramLoginRedirect.jsx` с `data-auth-url`.
* **CSRF state:** пишем в `sessionStorage:tj_oauth_state` + **бэкап** в `localStorage:tg_oauth_state_last`.
* **Edge Function:**

  * Верифицируем `hash` (HMAC) + свежесть `auth_date` (± 300 сек).
  * Если пользователь есть — password grant, иначе создаём через `admin.createUser`, затем grant.
  * Возвращаем `session_token` (`access_token`, `refresh_token`).
* **Установка сессии:** `supabase.auth.setSession()` → **верифицируем** установку (см. `sessionUtils`) для избежания гонок.
* **iOS Safari устойчивость:** `iosSafariUtils` + `sessionUtils` предотвращают/лечат рассинхроны после бэкграунда:

  * детект iOS Safari,
  * проверка/перезапуск контекста,
  * сетевые ретраи для `invoke()`,
  * подтверждение факта установки сессии перед навигацией,
  * усиленный logout.

---

## 9) iOS Safari (ключевые решения устойчивости)

* **Проблема:** после возврата из бэкграунда WebKit может менять/изолировать контекст хранения, сетевой стек «просыпается» с таймаутами → state/токены расходятся, `invoke()` может «подвисать».
* **Что сделано:**

  1. `iosSafariUtils` — маркеры активности, проверка «подозрительности» контекста, refresh при необходимости, чистка артефактов.
  2. `sessionUtils` — обёртки с **повторами** вокруг `supabase.functions.invoke()` (1s → 2s → 4s) и **верификация** `setSession()` (ожидание `getSession()` с backoff до N секунд).
  3. Усиленный logout (`validatedStorage + AuthContext`) — полная чистка, iOS-специфичные cookie, небольшая задержка, форс-reload с cache-bust.
  4. В `TelegramCallbackPage.jsx` — телеметрия и проверки консистентности до выполнения основного флоу.

---

## 10) Деплой (GitHub Pages)

* Workflow (`.github/workflows/pages.yml`):

  * Создаёт `frontend/.env.production` из GitHub Secrets.
  * `npm ci` → `npm run build`.
  * Пишет `dist/CNAME` (`www.ipokerstyle.com`).
  * Копирует `index.html` в `404.html` (SPA fallback).
  * Загружает артефакт → деплоит в Pages.

**Быстрый роллбек:**

```
git checkout main
git pull
git revert <commit_sha>
git push
```

---

## 11) Миграции и БД

* Все изменения схемы — папка `supabase/migrations/`.
* **Основные таблицы:**

  * `tournaments` — события (дата, статус, настройки и т.п.).
  * `club_members` — профили (role, nickname, связка с auth.users).
  * `tournament_participants` — участники и результаты.
  * VIEW `global_player_ratings_v1` — агрегированный рейтинг.
* **Правило:** никаких ручных правок БД — только миграции.

---

## 12) Скрипты

В `frontend/`:

```bash
npm run dev       # локальная разработка
npm run build     # сборка
npm run lint      # линтер (если подключён)
```

---

## 13) Чеклисты тестирования

**Smoke (всегда после деплоя)**

* Открывается главная, навигация работает.
* Календарь турниров, модалки, профили — открываются.

**Auth**

* Email login/logout → повторный вход.
* Telegram login/logout → повторный вход.
* Проверка после бэкграунда (iOS Safari):

  1. **Сценарий A:** свернуть Safari на 1–2 мин → вернуться → **logout** → Telegram login. Должно стабильно проходить (может быть небольшой «ретрай»/задержка).
  2. **Сценарий B:** первичная авторизация (с вводом телефона / без). При проблемах — проверить, что появляются ретраи/логирование.

**Сеть**

* LTE/слабый канал: `invoke()` должен повторить 1–2 раза и пройти.

---

## 14) Траблшутинг

* **«Вечно висит “Завершаем вход…”»**
  Смотрим логи `TelegramCallbackPage`: проверка state, `invoke()` ретраи, подтверждение `getSession()`. На iOS подождать до \~20 сек (в редких случаях).
* **“Failed to send a request to the Edge Function.”**
  Сетевой таймаут после «пробуждения» модема. Повторная попытка должна проходить; ретраи включены.
* **«Ошибка безопасности. Попробуйте войти снова.»**
  Потерялся/рассинхронизировался `state` после бэкграунда. Повторите вход.
  Если не помогает — logout (усиленный), затем вход снова.
* **Email вход падает один раз после «плохого цикла» Telegram**
  Повторный вход по email обычно проходит, **после чего Telegram снова работает** (состояние «прочищается»).
* **Жёсткий сброс в iOS**
  Настройки Safari → очистка данных сайта + в Telegram → «Privacy & Security → Websites → убрать сайт» → повторить.

---

## 15) Телеметрия и тестовая страница

* Подробные логи в:

  * `TelegramCallbackPage.jsx` (маркировка `🔍`, `🔄`, `✅`, `❌`, `🍎`).
  * `AuthContext.jsx` (события `SIGNED_IN/OUT`, загрузка профиля и т.п.).
  * `sessionUtils`/`iosSafariUtils` — этапы ретраев/подтверждений.
* Тест: `/tg-mobile-test.html`
  Используется для ручной диагностики мобильных кейсов (вставка виджета, логирование состояния стореджей/видимости).
  Примечание: страница редиректит в реальный callback — поэтому логи нужно смотреть до нажатия «Open OAuth».

---

## 16) Стиль кода и вклад

* Алиас `@` (настройка в `vite.config.js`).
* **Один** Supabase-клиент в `@/lib/supabaseClient`.
* useEffect — **минимальные** зависимости, без глобальных «побочек».
* Изменения — **маленькими пачками**; один риск — один PR; прогоняйте iOS Safari сценарии.

---

## 17) Выпуски и откаты

* Релиз = merge в `main` → GH Actions → Pages.
* После релиза — **smoke-чеклист** (см. выше), особенно iOS.
* Откат — `git revert` последнего коммита (или проблемной пачки), затем `push`.

---

## 18) Глоссарий

* **GoTrue** — auth-сервис Supabase (email/password, токены, refresh).
* **Edge Function** — серверная функция (Deno) на Supabase (наш: `telegram-auth-callback`).
* **Password grant** — ручная выдача токенов по email/password (для shadow-учётки Telegram).
* **tg\_oauth\_state** — CSRF-ключ возврата из Telegram OAuth (sessionStorage + бэкап в localStorage).
* **ValidatedStorage** — обёртка над localStorage для защиты от «битых» sb-токенов.
* **iOS Context Refresh** — набор процедур для борьбы с «рассинхроном» WebKit после бэкграунда.

---

## 19) Почему сделано именно так

* Telegram-OAuth через Edge Function даёт полный контроль: HMAC-верификация, собственная логика, **теневые** учётки для унификации с email-флоу.
* iOS Safari требует специальных мер устойчивости — без `iosSafariUtils`/`sessionUtils` флоу будет «шевелиться» в бэкграунд-кейсах (что и наблюдалось).
* GitHub Pages + CNAME — простая, быстрая и предсказуемая подача SPA. SPA fallback (`404.html`) решает проблему роутинга.

---

## 20) Контрольный список конфигурации (TL;DR)

* [ ] `frontend/.env.*` содержит **оба**: `VITE_TELEGRAM_BOT_USERNAME` и `VITE_TELEGRAM_BOT_ID`.
* [ ] В Supabase Function env заданы все ключи, в т.ч. `TELEGRAM_CLIENT_SECRET`, `SHADOW_PASSWORD_SECRET`.
* [ ] **CORS (ALLOW\_ORIGINS)** в Edge Function включает все прод-домены **и** `https://n347r1n0.github.io`, `http://localhost:5173`.
* [ ] **Redirect URLs** в Supabase → Authentication включают прод-домены **и** github.io + пути `/auth/telegram/callback`.
* [ ] На GitHub Pages настроен **CNAME** `www.ipokerstyle.com` и **HTTPS**.
* [ ] После деплоя выполнен **smoke-чек** (особенно **iOS Safari Scenario A**).

---

