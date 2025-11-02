# **CLAUDE.md**

## **1. Project Overview**

This is the IPS poker club ecosystem, two apps sharing one Supabase database:

* **Website (ips-website)** — React (Vite, Tailwind). Public hub: info pages, member management, tournament creation & preparation, user registration, stats. **This is the only codebase you work on.**
* **Poker Timer App** — Python (PySide6) desktop app used on‑site during live events. It pulls tournament data from the DB, runs the tournament (levels, eliminations), and writes back results. You don’t have access to this code. Infer behavior from DB schema and context I provide.

### **1.1. Project Structure (meaningful folders and files)**

```
ips-website/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── Admin/
│   │   │   │   │   ├── AdminRoute.jsx
│   │   │   │   │   ├── BlindsStructureEditor.jsx
│   │   │   │   │   ├── BlindsStructurePreview.jsx
│   │   │   │   │   ├── BuyInSettingsEditor.jsx
│   │   │   │   │   ├── DeleteConfirmModal.jsx
│   │   │   │   │   ├── MockTimerModal.jsx
│   │   │   │   │   └── TournamentModal.jsx
│   │   │   │   ├── AtmosphereGallery/
│   │   │   │   │   └── AtmosphereGallery.jsx
│   │   │   │   ├── Auth/
│   │   │   │   │   ├── AuthModal.jsx
│   │   │   │   │   ├── TelegramLoginWidget.jsx
│   │   │   │   │   └── TelegramLoginRedirect.jsx
│   │   │   │   ├── FAQ/
│   │   │   │   │   └── FAQ.jsx
│   │   │   │   ├── Hero/
│   │   │   │   │   └── HeroSection.jsx
│   │   │   │   ├── PlayerRatingWidget/
│   │   │   │   │   └── PlayerRatingWidget.jsx
│   │   │   │   ├── RegistrationForm/
│   │   │   │   │   ├── GuestFormModal.jsx
│   │   │   │   │   └── RegistrationForm.jsx
│   │   │   │   ├── TournamentCalendar/
│   │   │   │   │   ├── BlindsStructureViewer.jsx
│   │   │   │   │   ├── BuyInSummary.jsx
│   │   │   │   │   ├── EventMarker.jsx
│   │   │   │   │   ├── RegistrationConfirmationModal.jsx
│   │   │   │   │   ├── TournamentCalendar.jsx
│   │   │   │   │   ├── TournamentListForDay.jsx
│   │   │   │   │   ├── TournamentResultsModal.jsx
│   │   │   │   │   └── UpcomingTournamentsModal.jsx
│   │   │   │   ├── UserPaths/
│   │   │   │   │   └── UserPathsSection.jsx
│   │   │   │   └── ValueProps/
│   │   │   │       ├── FeatureCard.jsx
│   │   │   │       └── ValuePropsSection.jsx
│   │   │   ├── layout/ (Header, Footer, Section, etc.)
│   │   │   └── ui/ (AuthErrorDisplay, Button, GlassPanel, Toast, etc.)
│   │   ├── contexts/ (AuthContext.jsx)
│   │   ├── hooks/ (useAuthVersion.js, useMediaQuery.js)
│   │   ├── lib/
│   │   │   ├── supabaseClient.js
│   │   │   ├── authSynchronizer.js
│   │   │   ├── sessionUtils.js
│   │   │   ├── preAuthCleanup.js
│   │   │   ├── validatedStorage.js
│   │   │   ├── iosSafariUtils.js
│   │   │   └── …
│   │   ├── pages/ (HomePage, AdminDashboardPage, DashboardPage, TelegramCallbackPage)
│   │   ├── App.jsx, main.jsx, index.css
│   ├── tailwind.config.js, postcss.config.js, vite.config.js
│   ├── AUTH-SYSTEM.md, CLAUDE.md, README.md
│   └── .env.local, .env.development.local
└── supabase/
    ├── functions/
    │   ├── telegram-auth-callback/
    │   │   └── index.ts
    │   └── mock-tournament-ender/
    │       └── index.ts
    └── migrations/
```

> **Note:** You work strictly within the website repo. If you need a PROD-only file reference for comparison, a curated mirror may appear under `frontend/src/PROD_comparison/…`.

---

## **2. Core Technologies**

* **Frontend:** React, Vite, Tailwind CSS, Framer Motion, React Router, Zustand
* **Backend:** Supabase (PostgreSQL, GoTrue Auth), Supabase Edge Functions (Deno, TypeScript)
* **JS Client:** `@supabase/supabase-js` v2.55.0 (shared instance)
* **Timer App:** Python, PySide6 (no code access here)

---

## **3. Development Workflow & Architecture**

* **Decoupled architecture:** Static SPA frontend ⟷ Supabase backend (DB + Edge Functions).
* **Environment:** Assume **production codebase** unless the user explicitly says otherwise.
* **DB changes:** All schema changes **must** be implemented as migration files under `/supabase/migrations/`. **No direct manual edits** via Studio/console in production.
* **Allowed work dirs:** `/frontend/**`, `/supabase/functions/**`.
* **Hard excludes:** `/node_modules/**`, `/public/**`, `/dist/**`.
* The public assets folder exists and is correctly configured — don’t raise concerns about missing images.
* **No dependency/build/config changes** (e.g., `vite.config.js`, `package.json`) unless explicitly instructed.

### **3.1. Migration Discipline (clarified)**

* **Everything DB-related goes via migrations**, including:

  * Storage bucket creation (`storage.buckets`) and **all** RLS policies for `storage.objects`.
  * Triggers, functions, and security definer routines.
* **System schemas:** Do **not** change owners or disable RLS on `auth`, `storage`, etc. Migrations must not attempt to `ALTER OWNER` of system tables.
* **Auth trigger invariant:** Trigger `on_auth_user_created` on `auth.users` must call `public.handle_new_auth_user()` (SECURITY DEFINER) with `search_path 'public','auth','pg_temp'`. Do not alter this contract.
* **PR Checklist for DB:**

  * Local: `supabase db reset` applies migrations cleanly.
  * Verify bucket/policies if relevant (see §7.4).
  * Migrations committed alongside code (`db(...):` conventional prefix).

---

## **4. Frontend Development Context**

* **Commands:** `npm run dev`, `npm run build`, `npm run lint`
* SPA via `react-router-dom`.
* **Design system:** Dark theme, glassmorphism with art‑deco gold accents. Reuse components from `/components/ui` and utility classes from `index.css`.
* **Supabase client:** **single** shared instance from `@/lib/supabaseClient`.
* Always import with `@` alias; never deep relative paths that could create a second client instance.
* Before any auth‑dependent query, **always** call `await supabase.auth.getSession()` (handles OAuth redirects and stale state).

**UI/UX Conventions**

* Prefer fixed headers with gradient dividers in modals; avoid global style hacks.
* Use Framer Motion for modal enter/exit only; no heavy animation during content scroll.
* Respect safe‑area insets on mobile (`env(safe-area-inset-*)`).

---

## **5. Backend Development Context (Edge Functions)**

* Functions live in `/supabase/functions/{name}/index.ts`.
* Call from client via `supabase.functions.invoke(name, { body })`.
* Secrets & keys must come from `Deno.env.get(...)`.

### **5.1. Two‑Client Pattern (Security)**

* **User client** (init with user’s `Authorization` header) — used only to **verify** permissions (e.g., check `club_members.role`).
* **Admin client** (init with `SERVICE_ROLE_KEY`) — used to perform **privileged** mutations **after** permission check.

```ts
import { createClient } from 'npm:@supabase/supabase-js@2.55.0'

const url = Deno.env.get('SUPABASE_URL')!;
const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const authHeader = req.headers.get('Authorization') ?? '';

const userClient = createClient(url, anon, {
  global: { headers: { Authorization: authHeader } },
});
const adminClient = createClient(url, service);

// 1) verify role with adminClient (outside RLS)
const { data: { user } } = await userClient.auth.getUser();
const { data: me } = await adminClient
  .from('club_members')
  .select('role')
  .eq('user_id', user.id)
  .single();

if (!me || me.role !== 'admin') return new Response('Forbidden', { status: 403 });

// 2) perform mutation with adminClient
```

### **5.2. Telegram callback – operational notes**

* Import supabase client using an **import spec**:
  `import { createClient } from 'npm:@supabase/supabase-js@2.55.0'`
* Expected secrets (Edge → Secrets):

  * `SB_URL`, `SB_ANON_KEY`, `SB_SERVICE_ROLE_KEY` *(fallbacks exist for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)*
  * `TELEGRAM_CLIENT_SECRET` *(bot token for signature verification)*
  * `SHADOW_PASSWORD_SECRET` *(salt for deterministic password `shadow:<telegram_id>`)*
  * `DEBUG_TELEGRAM_BYPASS` = `"false"` in production
* **Verify JWT:** disabled by default. If you enable it, callers must send both headers: `Authorization: Bearer <ANON_KEY>` and `apikey: <ANON_KEY>`.
* **CORS allowlist (prod):** `https://ipoker.style`, `https://www.ipoker.style`, `https://n347r1n0.github.io`, `http://localhost:5173`.
* The function returns a **session_token**; the client must set it via `supabase.auth.setSession(tokens)`.

---

## **6. Rules & Interaction Protocol**

* Keep changes **localized**; follow existing patterns and conventions.
* Ask **targeted clarifying questions** before proposing code that depends on uncertain preconditions.
* Prefer focused `useEffect` hooks with correct dependency arrays.
* Don’t introduce global CSS overrides that can regress other parts of the app.

---

## **7. System Architecture & Data Model**

### **7.1. Database Schema (high level)**

* **tournaments** — main events table. Includes:

  * `status` with lifecycle constraint (scheduled, registration_open, completed, …) enforced via CHECK.
  * `tournament_date`, `settings_json`, and other metadata.
* **club_members** — user profiles linked to `auth.users`, includes role (member/admin), nickname, etc.

  * Profile creation/update happens **via trigger** `auth.users → on_auth_user_created → public.handle_new_auth_user()` (**SECURITY DEFINER**).
* **tournament_participants** — links users/guests to tournaments. Written at registration; later updated with `final_place`, `rating_points`.
* **global_player_ratings_v1 (VIEW)** — global leaderboard aggregating `rating_points` across all completed tournaments (for both members and guests).

### **7.2. Authentication System (unified & clean)**

**Email/Password — Sign‑Up**

* Client: `supabase.auth.signUp(email, password, { data: { nickname } })`.
* DB trigger on_auth_user_created creates a row in `public.club_members`.
* Completion after email verification.

**Email/Password — Sign‑In**

* Client: `supabase.auth.signInWithPassword`.
* Session is established immediately.

**Telegram Sign‑In (Edge Function flow)**

* Client posts Telegram widget payload to `/functions/v1/telegram-auth-callback`.
* Function verifies HMAC and creates/retrieves the user with shadow credentials:

  * Verifies freshness of `auth_date` and HMAC using `TELEGRAM_CLIENT_SECRET`.
  * If the user doesn’t exist, creates it via `auth.admin.createUser()` with metadata; this triggers insertion into `public.club_members` via `on_auth_user_created`.
  * Performs a password grant with:

    * `email: tg_<telegram_id>@telegram.user`
    * `password: <SHADOW_PASSWORD_SECRET>:<telegram_id>`
* Returns `session_token`; client applies it using `supabase.auth.setSession(tokens)`.

**Auth State Management & Synchronization**

* **AuthContext.jsx** provides: user, profile (from `club_members`), loading, isAdmin, and auth helpers.
* Profile loading is async/non‑blocking inside auth change handlers.
* Integrated with **AuthSynchronizer** to prevent race conditions.
* **useAuthVersion:** a global bus that increments on any auth state change; includes initial session check for post‑OAuth mounts.

**Enhanced Session Management**

* `sessionUtils.js`: synchronized session establishment.
* `preAuthCleanup.js`: cleanup before auth attempts (iOS Safari specifics included).
* Mobile Network Resilience: high‑latency tolerant patterns.

### **7.3. Tournament System Implementation**

**Calendar Implementation**

* Single effect with deps `[currentDate, authVersion]`.
* UTC month window:

  * `start = new Date(Date.UTC(y, m, 1)).toISOString()`
  * `end = new Date(Date.UTC(m === 11 ? y + 1 : y, (m + 1) % 12, 1)).toISOString()`
* Query (visual fields):

  ```js
  select('id, name, tournament_date, status, settings_json, tournament_type, is_major')
    .gte('tournament_date', start)
    .lt('tournament_date', end)
    .order('tournament_date', { ascending: true })
  ```
* Proper loading/error states; call `await supabase.auth.getSession()` before querying.

**Tournament Types & Visual System**

* `tournament_type`: (Стандартный, Специальный, Фриролл, Рейтинговый) with corresponding icons/colors.
* `is_major`: boolean flag for special visual treatment.
* `EventMarker.jsx`: dynamic icon rendering based on type.
* **Admin Panel**: full CRUD + type configuration.

### **7.4. Storage (avatars) — model & RLS**

* Bucket: **`avatars`** (created by migration). Public read enabled (for public URLs). RLS remains **enabled** on `storage.objects`.
* Pathing convention: `users/<user_id>/avatar_<timestamp>.jpg`.
* Client usage: `supabase.storage.from('avatars')` for `upload()` and `getPublicUrl()`.
* **Policies** (on `storage.objects`, migration‑defined):

  * `SELECT`: allow if `bucket_id = 'avatars'` **and** bucket is public.
  * `INSERT/UPDATE/DELETE`: allow only for **authenticated** users and only **within their prefix** (`users/<auth.uid()>/…`).
* **No GRANTs** that bypass RLS. Do not alter owners of `storage.objects`.

---

## **8. UI Patterns & Known Frontend Issues**

**Modals / Z‑Index (Mobile)**

* Header uses `z-50`.
* Windowed modals use an overlay with `z-40` or `z-[60]` when `priority`.
* **Full‑screen** modals render `.neumorphic-container` (fixed shell). Ensure it sits **above** header on mobile: inline `style={{ zIndex: priority ? 60 : 40 }}` on the full‑screen container is acceptable.
* Respect safe‑area paddings and keep content scrollable inside.

**Avatar Uploader**

* Two modes: File (crop 1:1, 512×512 JPEG, upload) and URL (validate + save string).
* **Cropper preview** must preserve aspect ratio (no vertical stretch). Image transforms compute `minScale` to fully cover the square; clamp panning to avoid empty borders.
* On Save: parent calls `avatarRef.applyDraft()`; URL path bypasses upload, File path performs canvas render + storage upload + `getPublicUrl()`.
* Error toasts:

  * Canvas errors → “Не удалось подготовить аватар”.
  * Storage errors → “Хранилище недоступно: avatars …”.

---

## **9. Common Patterns & Best Practices**

**Auth checks (client)**

```js
const { isAdmin } = useAuth();
if (!isAdmin) {
  // show toast / block admin-only action
}
```

**API calls (client)**

```js
import { supabase } from '@/lib/supabaseClient';
await supabase.auth.getSession();
const { data, error } = await supabase.from('tournaments').select('*');
```

**Synchronized Auth Operations**

```js
import { synchronizedTelegramAuth, isAuthInProgress } from '@/lib/authSynchronizer';
if (isAuthInProgress(userId)) {
  // Handle concurrent auth attempt
}
const result = await synchronizedTelegramAuth(telegramData, authFunction);
```

**Two‑Client Pattern (edge function)**

```ts
const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
const adminClient = createClient(url, service);
// 1) verify with adminClient, 2) mutate with adminClient
```

---

## **10. Resolved Issues & Lessons Learned**

* **Telegram Auth tournament visibility**

  * **Root cause:** blocking `await loadUserProfile()` prevented `authVersion` increment.
  * **Fix:** make profile loading async/non‑blocking; let auth events finish immediately.

* **Admin delete tournament (“j is not a function”)**

  * **Root cause:** legacy `validateSession()` references.
  * **Fix:** remove legacy calls; use `isAdmin` from `AuthContext`.

* **AuthVersion after OAuth redirect**

  * **Root cause:** components mounted post‑SIGNED_IN didn’t increment version.
  * **Fix:** initial session check on bus creation.

* **Missing `club_members` row after Telegram auth (fixed)**

  * **Root cause:** missing `on_auth_user_created` trigger or incorrect privileges on `handle_new_auth_user`.
  * **Fix:** restored the trigger, confirmed `SECURITY DEFINER`, verified insertion.

* **Storage avatars missing (fixed by migration)**

  * **Root cause:** no `avatars` bucket and no RLS policies.
  * **Fix:** add bucket + policies via migration only. Frontend remains unchanged.

* **Mobile modal under header (fixed)**

  * **Root cause:** full‑screen branch z‑index lower than header.
  * **Fix:** raise full‑screen container z‑index to match overlay priority.

* **Avatar preview stretch (fixed)**

  * **Root cause:** preview CSS/transform not synced with crop geometry.
  * **Fix:** compute `minScale`, clamp panning, and keep `object-cover`‑like behavior in preview.

---

## **11. Current System Status**

**✅ Working:**

* Email & Telegram auth with race‑condition prevention
* Tournament calendar display with visual types
* Admin tournament management (create / edit / delete / simulate completion)
* Tournament type configuration (Стандартный, Специальный, Фриролл, Рейтинговый)
* Tournament registration flow
* Per‑tournament results modal
* Profile management + avatar upload (URL or File)
* Mobile navigation (2×2 grid)
* Personal dashboard with admin panel integration
* Auth state synchronization for multi‑device scenarios

**🔧 Guidelines:**

* Always import Supabase via `@/lib/supabaseClient` (single client).
* Use `useAuthVersion` for auth‑dependent effects.
* For auth operations, prefer synchronized methods from `authSynchronizer.js`.
* Check `isAuthInProgress()` before starting new auth operations.
* **All DB changes via migrations.**
* In edge functions, use the Two‑Client Pattern.
* Edge Functions: use `SB_*` secrets (with fallback to `SUPABASE_*`), plus `TELEGRAM_CLIENT_SECRET` and `SHADOW_PASSWORD_SECRET`; keep `DEBUG_TELEGRAM_BYPASS=false` in production.

**⚠️ Known Issues:**

* Russian mobile auth: significantly improved with synchronization, but edge cases in poor networks may persist.
* Mobile network timeouts: enhanced retry logic helps; extremely high latency can still cause issues.

---

## **12. Operational Playbooks (concise)**

**12.1. DB migration lifecycle**

1. Create migration file in `/supabase/migrations/`.
2. Run locally: `supabase db reset` → must apply cleanly.
3. Verify invariants (auth trigger, bucket/policies if touched).
4. Commit with `db(...):` prefix and push.
5. Apply in PROD via the established deployment flow.

**12.2. Storage avatars sanity checks**

* `select name, public from storage.buckets where name='avatars'` → row exists, public = true.
* `pg_policies` on `storage.objects` include SELECT/INSERT/UPDATE/DELETE policies scoped to `avatars` and `auth.uid()` prefix.

**12.3. Supabase client hygiene**

* One client only; always `await supabase.auth.getSession()` before queries.
* Never embed service keys in frontend.
