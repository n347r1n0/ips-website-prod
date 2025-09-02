# **CLAUDE.md**

## 1. Project Overview
This is the "IPS" poker club ecosystem, which consists of two main parts linked by a shared Supabase database:

  1. The Website (ips-website): A React web application (Vite, Tailwind CSS) that serves as the club's main hub. It's used for displaying information, managing club members, creating and preparing tournaments, user registration for events, and viewing statistics. This is the codebase you have access to.

  2. The Poker Timer App: A standalone Python (PySide6) desktop application. It acts as the on-site tool during live tournaments. It receives tournament data (players, structure) from the website, manages the tournament process (blinds, levels, player eliminations) autonomously, and sends the results back to the shared database. You do not have access to the Timer's codebase.

Your primary role is to assist in the development of the Website. You must infer the Timer's functionality based on its interaction with the shared database schema and the context I provide.

### 1.1. Project Structure (meaningful folders and files)
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
│   │   │   │   │   └── TournamentModal.jsx
│   │   │   │   ├── AtmosphereGallery/
│   │   │   │   ├── Auth/
│   │   │   │   ├── FAQ/
│   │   │   │   ├── Hero/
│   │   │   │   ├── PlayerRatingWidget/
│   │   │   │   ├── RegistrationForm/
│   │   │   │   ├── TournamentCalendar/
│   │   │   │   ├── UserPaths/
│   │   │   │   └── ValueProps/
│   │   │   ├── layout/
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── ScrollToTop.jsx
│   │   │   │   └── Section.jsx
│   │   │   └── ui/
│   │   │       ├── AuthErrorDisplay.jsx
│   │   │       ├── Button.jsx
│   │   │       ├── GlassPanel.jsx
│   │   │       └── Toast.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuthVersion.js
│   │   │   └── useMediaQuery.js
│   │   ├── lib/
│   │   │   ├── debugUtils.js (for debugging only)
│   │   │   ├── guestStore.js
│   │   │   ├── participantsAPI.js
│   │   │   ├── supabaseClient.js
│   │   │   ├── testTournaments.js (for debugging only)
│   │   │   └── validatedStorage.js
│   │   ├── pages/
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   └── TelegramCallbackPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.development.local
│   ├── .env.local
│   ├── AUTH-SYSTEM.md
│   ├── CLAUDE.md
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── vite.config.js
└── supabase/
  ├── functions/
  │   └── telegram-auth-callback/
  │        └── index.ts
  └── migrations/
```

## 2. Core Technologies
 - **Website (Frontend):** React, Vite, Tailwind CSS, Framer Motion, React Router, Zustand
 - **Website (Backend):** Supabase (PostgreSQL, GoTrue Auth)
 - **Website (Backend Logic):** Supabase Edge Functions (Deno, TypeScript)
 - **JS Client:** @supabase/supabase-js
 - **Poker Timer App:** Python, PySide6

## 3. Frontend Development Context
 - **Commands:** `npm run dev`, `npm run build`, `npm run lint`
 - **Key Concepts:** The app is a Single Page Application using react-router-dom. Global auth state is managed in AuthContext.jsx. All authentication UI (login, register, etc.) is handled by a central AuthModal.jsx.
 - **Design System:** The project uses a dark theme with glassmorphism, neumorphism and art-deco gold accents. Always reuse existing UI components from /frontend/src/components/ui and custom utility classes from /frontend/src/index.css to maintain visual consistency.

## 4. Backend Development Context
 - **Technology:** Server-side logic is implemented as Supabase Edge Functions using Deno and TypeScript
 - **Location:** Functions are located at `/supabase/functions/{function-name}/index.ts`
 - **Key Concepts:** Functions are invoked from the client using `supabase.functions.invoke()`. All secrets must be accessed via server-side environment variables (`Deno.env.get()`), never hardcoded.

## 5. Rules & Protocols

### Guardrails & Scope:
 - Allowed work directories are `/frontend/**` and `/supabase/functions/**`
 - Treat everything outside these directories as out of scope
 - Hard excludes: `/node_modules/**`, `/public/**`, `/dist/**`
 - The public folder with media assets exists and is correctly configured. Do not express concern about missing images.
 - Do not add dependencies or modify build/config files (vite.config.js, package.json, etc.) unless explicitly instructed

### Interaction Protocol:
 - Always use consistent import paths: `import { supabase } from '@/lib/supabaseClient'`
 - Never use relative imports like `'./supabaseClient'` as they can create multiple client instances
 - Follow existing patterns and code conventions in the project

## 6. System Architecture & Data Model

### 6.1. Database Schema
 - **tournaments:** The central table for all tournament events. Created and managed on the Website. Read by the Timer.
 - **club_members:** User profiles, linked to auth.users. Managed on the Website. Contains role information (member/admin).
 - **tournament_participants:** Links users/guests to specific tournaments. Records are created during registration on the Website, and updated with results (status, final_place) by the Timer.

### 6.2. Authentication System (Current - Clean & Simplified)

The system supports three authentication methods with a clean, unified approach:

**1) Email/Password Registration**
- Client calls `supabase.auth.signUp` with email, password, and nickname in `options.data`
- Database trigger `on_auth_user_created` creates a profile in `public.club_members`
- Registration completed upon email verification

**2) Email/Password Sign-In**
- Client calls `supabase.auth.signInWithPassword`
- Session established immediately

**3) Telegram Sign-In (Edge Function)**
- Client sends Telegram widget data to `/functions/v1/telegram-auth-callback` Edge Function
- Function verifies HMAC and creates/retrieves user with shadow credentials:
  - email = `tg_<telegram_id>@telegram.user`
  - Deterministic password based on telegram_id
- Returns session tokens, client calls `supabase.auth.setSession(tokens)`

### 6.3. Auth State Management

**AuthContext.jsx** provides:
- `user`: Current authenticated user
- `profile`: User profile from club_members table (includes role)
- `loading`: Initial auth loading state
- `isAdmin`: Boolean helper for admin role checking
- Auth functions: `signIn`, `signUp`, `signOut`, `signInWithTelegram`

**useAuthVersion Hook** (`/hooks/useAuthVersion.js`):
- Global singleton auth version bus on `window.__AUTH_VER_BUS__`
- Increments version on any auth state change
- Critical feature: Checks for existing session on bus creation (handles OAuth redirects)
- Used by components like TournamentCalendar to react to auth changes

**Key Implementation Details:**
- Profile loading happens **asynchronously** (non-blocking) in auth state change handler
- Single Supabase client instance across entire app
- Clean separation: auth state changes complete immediately, profile loads in parallel

### 6.4. Tournament Calendar Implementation

**TournamentCalendar.jsx** features:
- Single focused useEffect with dependencies: `[currentDate, authVersion]`
- UTC date filtering for proper timezone handling
- Calls `await supabase.auth.getSession()` before queries (OAuth redirect handling)
- Clean query: `select('id, name, tournament_date')`
- Proper loading states and error handling

## 7. Common Patterns & Best Practices

### Authentication Checks
```javascript
const { user, profile, isAdmin } = useAuth();

// For admin operations
if (!isAdmin) {
  toast.error('Admin privileges required');
  return;
}
```

### API Calls with Auth
```javascript
// Always use the shared client instance
import { supabase } from '@/lib/supabaseClient';

// For OAuth redirects, ensure session awareness
await supabase.auth.getSession();
const { data, error } = await supabase.from('tournaments').select('*');
```

### Component State Management
```javascript
// Use auth version for auth-dependent effects
const authVersion = useAuthVersion();

useEffect(() => {
  // This will rerun on auth state changes
  fetchData();
}, [authVersion, otherDeps]);
```

## 8. Resolved Issues & Lessons Learned

### ✅ **Fixed: Telegram Auth Tournament Visibility Bug**
**Root Cause:** Blocking `await loadUserProfile()` in auth state change handler prevented auth version from incrementing properly.

**Solution:** Made profile loading asynchronous (non-blocking) so auth events complete immediately.

### ✅ **Fixed: Admin Delete Tournament Bug** 
**Root Cause:** Legacy `validateSession()` function calls that were undefined, causing "j is not a function" errors.

**Solution:** Removed all `validateSession()` calls and replaced with clean `isAdmin` checks from AuthContext.

### ✅ **Fixed: useAuthVersion OAuth Redirect Issue**
**Root Cause:** Components mounting after `SIGNED_IN` event didn't trigger auth version increments.

**Solution:** Added session check on auth version bus creation to handle existing sessions.

## 9. Current System Status

**✅ All Core Features Working:**
- Email & Telegram authentication
- Tournament calendar display for all user types
- Admin tournament management (create, edit, delete)
- Tournament registration flow
- Profile management

**🔧 Development Guidelines:**
- No legacy `validateSession()` calls - use `isAdmin` from AuthContext
- Always use `@/lib/supabaseClient` import path
- Auth state changes are handled by useAuthVersion hook
- Profile loading is asynchronous and non-blocking
- Single focused effects with proper dependencies

The system is now stable and production-ready with clean, maintainable code patterns.
