# chore(ci): harden auto-PR & codex-review; improve git-clean-merged.ps1; refresh CODEX task

**Why**
- Make auto-open PR flow reliable and self-descriptive.
- Reduce CI noise via concurrency and soft checks.
- Provide quick review signal with artifact and bundle summary.

**What Changed**
- `auto-open-pr.yml`
  - Add concurrency group `pr-${{ github.ref }}` with cancel-in-progress.
  - Read `.github/pr.md` (title/body) with fallback to `.github/pr-title.txt`/`.github/pr-body.md` and last commit.
  - Warn (non-blocking) if title isn’t Conventional Commit.
  - Create/update PR via `actions/github-script` (base `main` or `${{ vars.PR_BASE }}`).
  - Optional labels/reviewers from `.github/pr-meta.json`.
  - Optional cleanup of PR meta via repo var `CLEANUP_PR_META`.
- `codex-review.yml`
  - Concurrency `codex-${{ github.event.pull_request.number || github.ref }}`.
  - Label `codex:review`; ping Codex to review.
  - Build frontend with Node 20; upload `frontend-dist` artifact; short bundle summary.
- `git-clean-merged.ps1`
  - Switches: `-Json`, `-Keep`, `-NoSwitch`, `-IncludeGone`, `-DryRun`.
  - Safety rails; exit codes 0/1/2; deletion counter.
- `TASK__git-preflight-action-postflight.md`
  - Refreshed template/order to match automation.

**Files**
- `.github/workflows/auto-open-pr.yml`
- `.github/workflows/codex-review.yml`
- `frontend/scripts/git-clean-merged.ps1`
- `docs/codex/TASK__git-preflight-action-postflight.md`

**Validation**
- Branch: `chore/ci-codex-automation-hardening-2025-10-28`.
- Two workflows run; artifact `frontend-dist` available; jobs green.

**Notes**
- If `CLEANUP_PR_META=true`, meta files are auto-removed; description now persists (workflow skips update when no meta).

