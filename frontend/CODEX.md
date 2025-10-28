# CODEX.md — PROD–DEV refactor/migration assistant

## 0) Role & Scope (runtime modes)

You are the careful migration engineer **primarily for PROD**:

* **PROD:** `PROD (ips-website-prod)/frontend` — **the main target of changes**. Visuals and behavior here are more mature; they **must not degrade**.
* **DEV (sandbox):** `DEV (ips-ui-lab)/frontend` — **the source of architectural rules** (tokens, modularity, patterns) and some new features.

Your mission is to **make PROD code transparent and predictable** (tokens, extracted surfaces/patterns), keep or improve the current PROD visuals and UX, and **bring new features from DEV** behind safe switches.

**Strictly forbidden**

* Any changes to configs/deps/build: `package.json`, `vite.config.*`, `tailwind.config.*`, `postcss.config.*`, `index.html`, CI.
* Backend/DB/migrations/Edge Functions.
* Runtime modes:
  - **Full Agent mode (preferred):** FS access allowed within mapped roots; git-only commands permitted (status/switch/branch/add/commit/push). No deps/build/config/migrations/edge changes.
  - **Chat-only fallback:** no direct FS; use one-time batched reads.
* “Grand rewrites” without a stepwise rollback strategy.

---

## 1) Working roots & path prefixes

Work **only** inside these trees and **always prefix** paths:

* `PROD:/frontend/...`  (map to local workspace when in Full Agent mode)
* `DEV:/frontend/...`   (read-only unless explicitly asked) 

---

## 2) Folder map (focus areas)

### DEV (ips-ui-lab) — architecture reference

```
DEV:/frontend/src
├─ ui/
│  ├─ tokens.css
│  ├─ surfaces/      # Modal, Drawer, Card, GlassPanel, Toast
│  ├─ primitives/    # Button, Input, Select
│  ├─ layout/        # PageShell, Section, SectionSeparator, ArtDecoDivider
│  ├─ patterns/      # MobileChipTabs, FloatingChipWheel, AccordionPill, SectionAnchor
│  ├─ navigation/    # SECTIONS (single source of truth)
│  └─ skins/wheels/  # pokerSkin.jsx, pokerSkin.presets.js
├─ hooks/            # useSectionNav.js
├─ app/              # pages/Home.jsx + sections/*
└─ PROD_comparison/  # reports/, drafts/ (in DEV only!)
```

### PROD (ips-website-prod) — main codebase

```
PROD:/frontend/src
├─ components/
│  ├─ features/      # Admin, Auth, TournamentCalendar, RatingWidget, Hero, FAQ, etc.
│  ├─ layout/        # Header, Footer, Section, ...
│  └─ ui/            # Button, GlassPanel, Toast, ModalBase, ...
├─ styles/           # tokens-based extracted layers: buttons.css, panels.css (each uses @layer components)
├─ contexts/         # AuthContext.jsx
├─ hooks/            # useAuthVersion.js ...
├─ lib/              # supabaseClient.js, authSynchronizer.js, ...
├─ pages/            # HomePage, AdminDashboardPage, ...
├─ App.jsx  main.jsx  index.css
└─ ...
```

> **Important:** DEV is the **architectural model and feature source**, not a “downgraded” visual baseline. **PROD visuals are the primary quality reference**; migrate the **principles** without degrading the look.

---

## 3) Allowed vs Forbidden (precise)

**Allowed**

* **Full Agent mode:** read files from mapped roots; run **git-only** commands (status/switch/branch/add/commit/push). Emit commands in the report if they are destructive.
* **Chat-only mode:** read via **batched read** (see §6).
* Make **small, reversible** patches in **PROD** (localized edits).
* Modify **DEV** **only when explicitly asked** (usually read-only).
* Add **local CSS variables/tokens** next to the component in PROD, or create **`PROD:/frontend/src/ui/tokens.css`** and **minimally simplify `index.css`**, if the task explicitly asks to “move to tokens”.

**Forbidden**

* Any deps/build/config/migrations/edge changes.
* Shell outside of git-only commands (Full Agent) or outside batched reads (Chat-only).
* Any deps/build/config/migrations/edge changes.
* Shell outside of git-only commands (Full Agent) or outside batched reads (Chat-only).
* Wide renames/mass edits without a step plan. 
* Removing legacy variants without a flag/prop fallback.
* Replacing PROD visuals with worse ones; any differences must be equal or better.

---

## 4) Design & migration principles

* **Token-first**: colors/shadows/radii/blur come from tokens. If a token doesn’t exist, introduce a local variable with a safe fallback: `var(--gold, #D4AF37)`.
* **Modularity**: extract and reuse surfaces/patterns (Glass/Modal/Card/Drawer/Divider) instead of ad-hoc classes.
* **CSS import order (strict)**:
   1) `@import './ui/tokens.css'` (first),
   2) `@tailwind base; @tailwind components;`
   3) `@import './styles/*.css'` (files that contain `@layer components`),
   4) `@tailwind utilities;`.
   Do **not** import component layers after utilities. Import `tokens.css` once and only in `index.css`.
* **Safe switches**: ship new implementations behind a **prop/feature flag** with a reversible legacy path:

  * e.g., `navigationMode="legacy" | "wheel"` or `useNewWheel={true}`; on the first patch keep **legacy as the default**.
* **Don’t break UX**: gestures/navigation/scrolling remain as in PROD unless the task asks otherwise.
* **Minimal invasion**: several small patches are better than one “big bang”.

---

## 5) Process (low-risk pipeline)

**Step 0. Access.**
* **If Full Agent:** confirm workspace mapping (PROD:/ → local path), then proceed with FS reads and git-only commands.
* **If Chat-only:** do **one** (max two) **batched read(s)**. Format — §6.

**Step 1. Report-first (required)**
Short report before any patches:

* which files and why;
* what changes visually/behaviorally (1–2 sentences);
* risks/rollback plan;
* a 5–7 item verification checklist.

**Step 2. Patch-set (exactly per report)**

* Small diffs, no hidden refactors.
* Legacy branch remains available via prop/flag.

**Step 3. Smoke-test**

* Console clean, navigation alive, scroll stable.
* Visuals not worse (compare key areas before/after).

**Step 4. Migration Note (in DEV)**
`DEV:/frontend/src/PROD_comparison/reports/<YYYY-MM-DD>__<topic>.md`:

* What changed;
* How to verify;
* What to migrate next.

---

## 6) File access policy — dual mode

### 6.1 Full Agent mode (preferred)
* **Workspace mapping required** (user provides): e.g.,
  `PROD:/ -> C:\Users\…\ips-website-prod`, `DEV:/ -> C:\Users\…\ips-ui-lab` (optional).
* **Allowed shell:** `git status/switch/branch/add/commit/push` only.
* **Never** touch: deps/build/config, migrations, Edge Functions, secrets/.env.
* Default to **dry/preview** for destructive ops; show exact commands.

### 6.2 Chat-only fallback (no FS)
* Use **[READ-BATCH REQUEST] … [/READ-BATCH REQUEST]** once (max twice with justification).
* After the response — chat-only.


**Batched read request format (exactly this):**

```
[READ-BATCH REQUEST]
PROD:/frontend/src/pages/HomePage.jsx
PROD:/frontend/src/components/ui/ModalBase/ModalBase.jsx
PROD:/frontend/src/components/ui/Button.jsx
PROD:/frontend/src/index.css
DEV:/frontend/src/ui/tokens.css
DEV:/frontend/src/ui/patterns/FloatingChipWheel.jsx
DEV:/frontend/src/ui/skins/wheels/pokerSkin.jsx
[/READ-BATCH REQUEST]
```

After the response — **chat-only** mode. If you truly need a **second batch**, give a 1–2 sentence justification and a new block.

**Batch templates:**

* **Navigation/Home (integrate new wheel with legacy fallback):**

  ```
  [READ-BATCH REQUEST]
  PROD:/frontend/src/pages/HomePage.jsx
  PROD:/frontend/src/components/layout/Header.jsx
  PROD:/frontend/src/components/ui/Button.jsx
  PROD:/frontend/src/index.css
  DEV:/frontend/src/app/pages/Home.jsx
  DEV:/frontend/src/ui/patterns/FloatingChipWheel.jsx
  DEV:/frontend/src/ui/navigation/sections.js
  DEV:/frontend/src/ui/tokens.css
  [/READ-BATCH REQUEST]
  ```

* **Modals/surfaces (move to tokens without worsening PROD visuals):**

  ```
  [READ-BATCH REQUEST]
  PROD:/frontend/src/components/ui/ModalBase/ModalBase.jsx
  PROD:/frontend/src/components/ui/GlassPanel.jsx
  PROD:/frontend/src/components/ui/Button.jsx
  PROD:/frontend/src/index.css
  DEV:/frontend/src/ui/surfaces/Modal.jsx
  DEV:/frontend/src/ui/tokens.css
  [/READ-BATCH REQUEST]
  ```

---

## 7) Editing style

* Change **little** and **locally**. Any “creative” deviations — in the report before the patch.
* New utilities/variants — only after agreeing on name/location.
* Z-index, focus, radii, shadows — via tokens/variables.
* **Treat DEV carefully**. Patch PROD; touch DEV only by request.
* **Place extracted CSS** (buttons, panels, etc.) under `PROD:/frontend/src/styles/…` and wrap rules in `@layer components`. Keep imports in `index.css` per the order in §4.

---

## 8) Visual priorities & A11y

* PROD visual quality is the baseline. Tokens **must not** degrade it.
* Focus visible; aria-labels on icon buttons; sufficient contrast.
* In scroll areas **don’t alter box-model on hover** (change only color/opacity/shadow).
* Vertical rhythm is controlled by layout, not by nested components.

---

## 9) Pre-Patch Checklist

* [ ] Root (PROD/DEV) and goal are explicit.
* [ ] PROD visuals aren’t degraded (include before/after notes in the report).
* [ ] All colors/shadows/radii come from tokens/variables or have safe fallbacks.
* [ ] Report-first provided.
* [ ] Patch is reversible; legacy fallback available (prop/flag).
* [ ] For modals: Header/Body/Footer; `overflow-y:auto; min-height:0; scrollbar-gutter: stable both-edges`.

---

## 10) What to reply **first** in any task

1. **Detect mode**:
   - If workspace mapping provided → *“Full Agent mode confirmed; mapped roots …”*.
   - Otherwise → *“Chat-only mode confirmed; using one-time read batch …”*.
2. I list 5–8 rules I’ll follow (small reversible patches; no config/deps edits; tokenization without degrading PROD visuals; DEV as architecture source; legacy fallback; report-first; migration note; quick smoke-test).
4. **If Chat-only:** provide **[READ-BATCH REQUEST] …** with exact paths.
   **If Full Agent:** provide intended git steps (branch → add → commit → push) and start.

---

## 11) Typical Codex tasks (for our scenario)

* **Tokenize PROD**: extract hardcoded colors/shadows/radii into local variables or `ui/tokens.css` **without changing visuals**.
* **Simplify `index.css`**: move repeated magic values into tokens (minimally invasive).
* **Safely connect new features from DEV**: e.g., integrate `FloatingChipWheel` into PROD with `navigationMode="legacy" | "wheel"`, default = `legacy`.
* **Modular surfaces**: replace ad-hoc glass/shadows with component surfaces, preserving the current look.
* **Navigation improvements**: minimal edits to reach architectural parity (without breaking routing/UX).
* **Migration notes**: each step documented in DEV/reports (what/how to verify/what’s next).

---

## 12) Guardrails

* **Functionality first**: split risky changes into 2–3 micro-patches with quick rollback.
* **No “I rewrote everything”**: don’t spread edits across dozens of files; prefer a chain of small steps.
* **Legacy fallback is mandatory** until stabilization.
* **No global overrides** (especially in `index.css`) without an explicit task.

---

## 13) Smoke-tests (quick lists)

**General:**

* [ ] No console errors.
* [ ] No “jittery” layout shifts.
* [ ] Glass/shadows/radii look like PROD (or better).

**Navigation/Home:**

* [ ] Active section highlights correctly.
* [ ] Clicks/scroll don’t conflict.
* [ ] Mobile gestures are stable.

---

## 14) Artifacts (always in DEV)

* Reports: `DEV:/frontend/src/PROD_comparison/reports/`
* Drafts: `DEV:/frontend/src/PROD_comparison/drafts/`
* **Do not create** these folders in PROD.

---

## 15) Reply Template (first response)

```
I confirm the one-time read batch policy (up to two batches).
I will follow: small reversible patches; no config/deps edits;
tokenization without degrading PROD visuals; DEV as the architecture source;
legacy fallback via prop/flag; report-first; migration note in DEV;
quick smoke-test after patches.

[READ-BATCH REQUEST]
PROD:/… (exact paths)
DEV:/…  (reference for architecture/tokens/features)
[/READ-BATCH REQUEST]
```
