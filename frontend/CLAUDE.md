# **CLAUDE.md**

## **1\. Project Overview**

This is the IPS poker club ecosystem, two apps sharing one Supabase database:

* **Website (ips-website)** — React (Vite, Tailwind). Public hub: info pages, member management, tournament creation & preparation, user registration, stats. This is the only codebase you work on.  
* **Poker Timer App** — Python (PySide6) desktop app used on-site during live events. It pulls tournament data from the DB, runs the tournament (levels, eliminations), and writes back results. You don’t have access to this code. Infer behavior from DB schema and context I provide.

### **1.1. Project Structure (meaningful folders and files)**

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
│   │   │   │   ├── Auth/  
│   │   │   │   ├── FAQ/  
│   │   │   │   ├── Hero/  
│   │   │   │   ├── PlayerRatingWidget/  
│   │   │   │   ├── RegistrationForm/  
│   │   │   │   ├── TournamentCalendar/  
│   │   │   │   │   ├── BlindsStructureViewer.jsx  
│   │   │   │   │   ├── BuyInSummary.jsx  
│   │   │   │   │   ├── EventMarker.jsx  
│   │   │   │   │   ├── RegistrationConfirmationModal.jsx  
│   │   │   │   │   ├── TournamentCalendar.jsx  
│   │   │   │   │   ├── TournamentListForDay.jsx  
│   │   │   │   │   └── TournamentResultsModal.jsx  
│   │   │   ├── layout/ (Header, Footer, etc.)  
│   │   │   └── ui/ (AuthErrorDisplay, Button, GlassPanel, Toast)  
│   │   ├── contexts/ (AuthContext.jsx)  
│   │   ├── hooks/ (useAuthVersion.js, useMediaQuery.js)  
│   │   ├── lib/ (supabaseClient.js, participantsAPI.js, etc.)  
│   │   ├── pages/ (HomePage.jsx, AdminDashboardPage.jsx, etc.)  
│   │   ├── App.jsx, main.jsx, index.css  
│   ├── tailwind.config.js, postcss.config.js, vite.config.js  
│   ├── AUTH-SYSTEM.md, CLAUDE.md  
│   └── .env.local, .env.development.local  
└── supabase/  
    ├── functions/  
    │   ├── telegram-auth-callback/  
    │   │   └── index.ts  
    │   └── mock-tournament-ender/  
    │       └── index.ts  
    └── migrations/

## **2\. Core Technologies**

* **Frontend:** React, Vite, Tailwind CSS, Framer Motion, React Router, Zustand  
* **Backend:** Supabase (PostgreSQL, GoTrue Auth), Supabase Edge Functions (Deno, TypeScript)  
* **JS Client:** @supabase/supabase-js  
* **Timer App:** Python, PySide6 (no code access here)

## **3\. Development Workflow & Architecture**

* **Decoupled architecture:** Static SPA frontend \+ Supabase backend (DB \+ Edge Functions).  
* **Environment:** Assume development unless told otherwise.  
* **DB changes:** All schema changes must be implemented as migration files under /supabase/migrations/. No direct manual edits.  
* **Allowed work dirs:** /frontend/\*\*, /supabase/functions/\*\*.  
* **Hard excludes:** /node\_modules/\*\*, /public/\*\*, /dist/\*\*.  
* The public assets folder exists and is correctly configured — don’t raise concerns about missing images.  
* No dependency or build/config changes (e.g., vite.config.js, package.json) unless explicitly instructed.

## **4\. Frontend Development Context**

* **Commands:** npm run dev, npm run build, npm run lint  
* **SPA** via react-router-dom.  
* **Design system:** dark theme, glassmorphism (with a touch of art-deco gold). Reuse components from /components/ui and utility classes from index.css.  
* **Supabase client:** single shared instance from @/lib/supabaseClient.  
* Always import with @ alias; never relative paths like './supabaseClient' (prevents duplicate clients).  
* Before any auth-dependent query, call await supabase.auth.getSession() (handles OAuth redirects).  
* Use UTC-safe date logic where relevant (e.g., calendar month boundaries).

## **5\. Backend Development Context (Edge Functions)**

* Functions live in /supabase/functions/{name}/index.ts.  
* Call from client via supabase.functions.invoke(name, { body }).  
* Secrets & keys must come from Deno.env.get(...).  
* **Two-Client Pattern (Security):**  
  * **User client** (init with user’s Authorization header) — used only to verify permissions (e.g., check club\_members.role).  
  * **Admin client** (init with SERVICE\_ROLE\_KEY) — used to perform privileged mutations (UPDATE/INSERT/DELETE) after permission check.  
* Main functions today: telegram-auth-callback, mock-tournament-ender.

## **6\. Rules & Interaction Protocol**

* Keep changes localized; follow the existing patterns and conventions.  
* Ask targeted clarifying questions before proposing code that depends on uncertain preconditions (don’t assume user is anonymous/admin/etc.).  
* Prefer focused effects with correct dependency arrays.  
* Don’t introduce “global” style overrides that can regress other parts of the app.

## **7\. System Architecture & Data Model**

### **7.1. Database Schema (high level)**

* **tournaments** — main events table. Includes:  
  * status with lifecycle constraint (e.g., scheduled, registration\_open, completed, …) enforced via CHECK.  
  * tournament\_date, settings\_json, and other metadata.  
* **club\_members** — user profiles linked to auth.users, includes role (member/admin), nickname, etc.  
* **tournament\_participants** — links users/guests to tournaments. Written at registration; later updated with final\_place, rating\_points.  
* **global\_player\_ratings\_v1 (VIEW)** — global leaderboard aggregating rating\_points across all completed tournaments (for both members and guests).

### **7.2. Authentication System (Current, unified & clean)**

Auth methods supported:

* **Email/Password — Sign-Up**  
  * Client calls supabase.auth.signUp with email, password, and options.data.nickname.  
  * DB trigger on\_auth\_user\_created creates a row in public.club\_members.  
  * Completion after email verification.  
* **Email/Password — Sign-In**  
  * Client calls supabase.auth.signInWithPassword.  
  * Session is established immediately.  
* **Telegram Sign-In (Edge Function flow)**  
  * Client posts Telegram widget payload to /functions/v1/telegram-auth-callback.  
  * Function verifies HMAC and creates/retrieves the user with shadow credentials:  
    * email \= tg\_\<telegram\_id\>@telegram.user, password is deterministic from telegram\_id.  
  * Function returns session tokens; client sets them via supabase.auth.setSession(tokens).

**Auth State Management**

* **AuthContext.jsx** provides:  
  * user, profile (from club\_members), loading, isAdmin, and auth helpers (signIn, signUp, signOut, signInWithTelegram).  
  * Profile loading is asynchronous/non-blocking inside auth change handlers, so auth events complete immediately.  
* **useAuthVersion:** a global bus that increments on any auth state change; includes initial session check for post-OAuth mounts. Components that depend on auth should subscribe to authVersion.

### **7.3. Tournament Calendar Implementation (key points)**

* Single focused useEffect with deps \[currentDate, authVersion\].  
* UTC month window:  
  * start \= new Date(Date.UTC(y, m, 1)).toISOString()  
  * end \= new Date(Date.UTC(m \=== 11 ? y \+ 1 : y, (m \+ 1\) % 12, 1)).toISOString()  
* Query (example):  
  select('id, name, tournament\_date, status, settings\_json')  
  .gte('tournament\_date', start).lt('tournament\_date', end)  
  .order('tournament\_date', { ascending: true })  
* Proper loading/error states; avoid multiple clients; call await supabase.auth.getSession() before querying.

## **8\. Common Patterns & Best Practices**

**Auth checks (client)**

const { isAdmin } \= useAuth();  
if (\!isAdmin) {  
  // show toast / block admin-only action  
}

**API calls (client)**

import { supabase } from '@/lib/supabaseClient';  
await supabase.auth.getSession();  
const { data, error } \= await supabase.from('tournaments').select('\*');

**Two-Client Pattern (edge function)**

const url \= Deno.env.get('SUPABASE\_URL')\!;  
const anon \= Deno.env.get('SUPABASE\_ANON\_KEY')\!;  
const service \= Deno.env.get('SUPABASE\_SERVICE\_ROLE\_KEY')\!;  
const authHeader \= req.headers.get('Authorization') ?? '';

const userClient \= createClient(url, anon, {  
  global: { headers: { Authorization: authHeader } },  
});  
const adminClient \= createClient(url, service);

// 1\) verify role with adminClient outside RLS  
const { data: { user } } \= await userClient.auth.getUser();  
const { data: me } \= await adminClient  
  .from('club\_members')  
  .select('role')  
  .eq('user\_id', user.id)  
  .single();

if (\!me || me.role \!== 'admin') return new Response('Forbidden', { status: 403 });

// 2\) perform mutation with adminClient

## **9\. Resolved Issues & Lessons Learned**

* **Telegram Auth tournament visibility**  
  * **Root cause:** blocking await loadUserProfile() in auth handler prevented authVersion increment.  
  * **Fix:** make profile loading async/non-blocking; let auth events finish immediately.  
* **Admin delete tournament (“j is not a function”)**  
  * **Root cause:** legacy validateSession() references.  
  * **Fix:** remove legacy calls; use isAdmin from AuthContext.  
* **AuthVersion after OAuth redirect**  
  * **Root cause:** components mounted post-SIGNED\_IN didn’t increment version.  
  * **Fix:** initial session check on bus creation.

## **10\. Current System Status**

**✅ Working:**

* Email & Telegram auth  
* Tournament calendar display  
* Admin tournament management (create / edit / delete / simulate completion)  
* Tournament registration flow  
* Per-tournament results modal (reads tournament\_participants)  
* Profile management

**🔧 Guidelines:**

* Always import Supabase via @/lib/supabaseClient (single client).  
* Use useAuthVersion for auth-dependent effects.  
* All DB changes via migrations.  
* In edge functions, use the Two-Client Pattern.
