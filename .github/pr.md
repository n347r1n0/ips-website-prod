# chore(ci): auto-open PR as user via PAT; idempotent Codex ping; keep meta guard; docs: dual-mode

**Why**
- PRs should open **from my account** when PAT is present, otherwise fall back to bot.
- Avoid noisy duplicates and “meta wipe”: preserve title/body when no meta files exist.
- Make Codex review predictable: single marker comment + explicit `@codex review`.
- Document agent working modes for future contributors.

**What Changed**
- **auto-open-pr.yml**
  - Concurrency `pr-${{ github.ref }}` with cancel-in-progress.
  - PAT path (`AUTO_PR_TOKEN`) → create/update PR **as user**; bot fallback via `GITHUB_TOKEN`.
  - Meta guard: if no `.github/pr.*`, keep existing PR title/body.
  - Optional cleanup of PR meta files via `CLEANUP_PR_META`.
- **codex-review.yml**
  - Idempotent ping with `[[CODEX-REVIEW-PING]]` + `@codex review`.
  - Optional reviewer request from `.github/pr-meta.json` and/or `vars.CODEX_REVIEWERS`.
  - Build **frontend** (Node 20) + upload `frontend-dist` artifact.
- **pr-meta.json** (if present)
  - Seed labels/reviewers for auto-apply.
- **Docs**
  - `CODEX.md`: dual-mode (Full Agent / Chat-only), git-only guardrails.
  - `AGENTS.md`: PR discipline checklist (reference).

**Files**
- `.github/workflows/auto-open-pr.yml`
- `.github/workflows/codex-review.yml`
- `.github/pr-meta.json` (optional)
- `CODEX.md`, `AGENTS.md`

**Validation**
- Push → **Auto open/update PR** job runs and (if PAT present) PR author = my user.
- PR body stays intact on later pushes **even if meta files are absent**.
- **Codex Review Prep** runs, applies label `codex:review`, uploads `frontend-dist`.
- Conversation has **one** ping comment with `[[CODEX-REVIEW-PING]]` and `@codex review`.

**Notes**
- Reviewer assignment requires valid collaborator usernames.
- Safe to re-run; ping is deduped; PR meta cleanup is optional via repo var.

