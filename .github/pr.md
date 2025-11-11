# Docs refresh — PROD-only system prompts

**Why**
Align repo with current workflow: PROD-only workspace for agents, clearer guardrails for code review and execution, unified reporting path under `docs/codex/`.

**What changed**
- Updated **AGENTS.md**: tightened P0/P1 gates, clarified review order (AGENTS → PR description → CODEX), removed chat-only mode notes, anchored docs-only reporting to `docs/codex/reports/`.
- Updated **CODEX.md**: PROD-only scope, Full Agent mode only, token-first emphasis, minimal-invasion rules, no PR-thread posting requirements.
- (If present) Added/updated `docs/codex/**` materials.

**Scope**
- **Docs only.** No runtime/code/config/DB changes.

**Verification**
- App builds & runs unchanged.
- No diffs under `frontend/src/**`, `supabase/**`, or configs.
- CI green.

**Risks/Mitigations**
- None (documentation-only).

**Files**
- `AGENTS.md`
- `CODEX.md`
- `docs/codex/**` (if any)
- `.github/pr.md`
