# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
```bash
cd frontend
npm ci                          # Install dependencies
npm run dev                     # Start dev server (localhost:5173)
npm run build                   # Production build
npm run preview                 # Preview production build
npm run lint                    # ESLint code quality check
```

### Database Operations
```bash
# Apply migrations (via Supabase CLI)
supabase db push                # Push migrations to remote
supabase db reset               # Reset local dev database
supabase migration new <name>   # Create new migration
```

### Testing & Deployment
```bash
# Manual testing checklist after changes:
# 1. Email/Telegram auth flows
# 2. Tournament calendar functionality 
# 3. Admin panel operations
# 4. Mobile navigation (2x2 grid)
# 5. iOS Safari compatibility tests
```

## Architecture Overview

### System Design
This is a **dual-application poker club ecosystem** sharing a single Supabase database:

1. **Website (React SPA)** - Public tournament management, player registration, admin tools
2. **Timer App (Python)** - Desktop application for live tournament execution (separate codebase)

### Technology Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion + React Router + Zustand
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Deployment**: GitHub Pages with GitHub Actions CI/CD
- **Auth**: Email/Password + Telegram OAuth via Edge Function

### Project Structure
```
ips-website/
├── frontend/                           # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── features/               # Feature-specific components
│   │   │   │   ├── Admin/              # Tournament CRUD, admin panel
│   │   │   │   ├── Auth/               # Login modals, Telegram widget
│   │   │   │   ├── TournamentCalendar/ # Calendar, registration, results
│   │   │   │   └── ValueProps/         # Landing page sections
│   │   │   ├── layout/                 # Header, Footer, Section
│   │   │   └── ui/                     # Reusable components
│   │   ├── contexts/AuthContext.jsx    # Global auth state management
│   │   ├── lib/                        # Core utilities
│   │   │   ├── supabaseClient.js       # Single Supabase client instance
│   │   │   ├── authSynchronizer.js     # Auth race condition prevention
│   │   │   ├── sessionUtils.js         # Session establishment
│   │   │   ├── iosSafariUtils.js       # iOS Safari stability fixes
│   │   │   └── validatedStorage.js     # Enhanced localStorage wrapper
│   │   ├── pages/                      # Route components
│   │   └── hooks/                      # Custom React hooks
└── supabase/
    ├── functions/                      # Edge Functions (Deno/TypeScript)
    │   ├── telegram-auth-callback/     # Telegram OAuth handler
    │   └── mock-tournament-ender/      # Development utility
    └── migrations/                     # Database schema versions
```

### Database Schema (Key Tables)
- **tournaments** - Main events table with status lifecycle, settings_json, tournament types
- **club_members** - User profiles linked to auth.users, includes roles (member/admin)
- **tournament_participants** - Registration tracking, final rankings, rating points
- **global_player_ratings_v1** - View aggregating rating points across tournaments

### Authentication System
**Dual Auth Methods:**
1. **Email/Password** - Standard Supabase auth with automatic profile creation
2. **Telegram OAuth** - Custom Edge Function flow with HMAC verification

**Auth State Management:**
- **AuthContext.jsx** - Global auth state with user, profile, loading states
- **authSynchronizer.js** - Prevents race conditions with device fingerprinting
- **Mobile Network Resilience** - Enhanced retry logic for high-latency connections
- **iOS Safari Stability** - Background context handling and storage cleanup

### Tournament System
**Visual Tournament Types:**
- Стандартный (🎯 teal)
- Специальный (⭐ gold) 
- Фриролл (⚡ red)
- Рейтинговый (🏆 gold)

**Calendar Implementation:**
- UTC-safe month boundaries for international users
- Single focused useEffect with proper dependency management
- Auth-aware tournament visibility

## Development Guidelines

### Import Patterns
```javascript
// ✅ Always use @ alias imports
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';

// ❌ Never use relative imports
import { supabase } from '../lib/supabaseClient'; // Creates duplicate clients
```

### Auth Operations
```javascript
// ✅ Use synchronized auth to prevent race conditions
import { synchronizedTelegramAuth, isAuthInProgress } from '@/lib/authSynchronizer';

if (isAuthInProgress(userId)) {
  showMessage('Authentication in progress...');
  return;
}
const result = await synchronizedTelegramAuth(telegramData, authFunction);

// ✅ Always check session before auth-dependent queries
await supabase.auth.getSession();
const { data, error } = await supabase.from('tournaments').select('*');
```

### Edge Function Pattern (Two-Client Security)
```typescript
// User client (with user's auth header) - for permission verification
const userClient = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } }
});

// Admin client (service role) - for privileged operations after verification
const adminClient = createClient(url, serviceRoleKey);

// 1) Verify permissions with userClient
const { data: { user } } = await userClient.auth.getUser();
const { data: member } = await adminClient
  .from('club_members')
  .select('role')
  .eq('user_id', user.id)
  .single();

if (member.role !== 'admin') return new Response('Forbidden', { status: 403 });

// 2) Perform mutation with adminClient
```

### Database Changes
- **All schema changes** must be implemented as migration files in `/supabase/migrations/`
- **Never make direct manual database edits**
- Use descriptive migration names: `YYYYMMDD_description.sql`

### Mobile & iOS Safari Considerations
- **Mobile-first responsive design** with 2x2 navigation grid
- **Russian mobile networks** - enhanced retry logic for high-latency connections
- **iOS Safari stability** - background context tracking, storage cleanup, cache busting
- **Always test auth flows** on iOS Safari after changes

### Performance Patterns
- **Single Supabase client** - import from `@/lib/supabaseClient` only
- **Focused useEffect** - minimal dependencies, proper cleanup
- **Auth state synchronization** - prevent concurrent operations
- **UTC-safe date handling** for international users

## Key Files to Understand

### Core Architecture
- `frontend/src/contexts/AuthContext.jsx` - Global auth state with iOS Safari handling
- `frontend/src/lib/authSynchronizer.js` - Race condition prevention system
- `frontend/src/lib/supabaseClient.js` - Single client instance configuration
- `supabase/functions/telegram-auth-callback/index.ts` - OAuth flow implementation

### Business Logic
- `frontend/src/components/features/TournamentCalendar/` - Tournament display and registration
- `frontend/src/components/features/Admin/` - Tournament management interface
- Database migrations in `supabase/migrations/` - Schema evolution history

### System Integration Points
- Tournament lifecycle: website creates → timer app executes → website displays results  
- Shared database ensures real-time synchronization between applications
- Edge Functions provide secure server-side operations for auth and admin tasks

## Known Issues & Solutions

### Russian Mobile Auth (Partially Resolved)
- **Issue**: High-latency networks cause auth timeouts
- **Solution**: AuthSynchronizer with enhanced retry logic and session deduplication
- **Status**: Significantly improved, monitor for edge cases

### iOS Safari Auth Stability (Resolved)
- **Issue**: Background/foreground cycles break auth context
- **Solution**: Context tracking, storage validation, cache-busting redirects
- **Testing**: Background Safari for 2+ minutes, return, test logout/login cycle

### Tournament Calendar Visibility (Resolved)  
- **Issue**: Tournament list doesn't update after auth changes
- **Solution**: Non-blocking profile loading, proper useAuthVersion integration
- **Pattern**: Always use `authVersion` dependency for auth-dependent effects

## Environment Configuration

### Required Environment Variables
```bash
# Frontend (.env.local)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
VITE_TELEGRAM_BOT_ID=1234567890

# Edge Functions (Supabase Dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
TELEGRAM_CLIENT_SECRET=your_bot_token
SHADOW_PASSWORD_SECRET=deterministic_password_salt
DEBUG_TELEGRAM_BYPASS=false  # Only true in development
```

### CORS Configuration
Update allowed origins in `supabase/functions/telegram-auth-callback/index.ts`:
```typescript
const ALLOW_ORIGINS = [
  'https://www.ipokerstyle.com',
  'https://ipokerstyle.com', 
  'http://localhost:5173', // Development
  // Add your domains here
];
```
