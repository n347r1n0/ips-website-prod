# chore(ci): harden auto-PR & codex-review; improve git-clean-merged.ps1; refresh CODEX task

Why
- Make auto-open PR flow reliable and self-descriptive.
- Reduce CI noise via concurrency and soft checks.
- Provide quick review signal with artifact and bundle summary.

What Changed
- auto-open-pr.yml
  - Add concurrency group `pr-${{ github.ref }}` with cancel-in-progress.
  - Read `.github/pr.md` (title/body) with fallback to `.github/pr-title.txt`/`.github/pr-body.md` and commit subject.
  - Warn (non-blocking) if title isn’t Conventional Commit.
  - Create/update PR via `actions/github-script` (base `main` or `${{ vars.PR_BASE }}`).
  - Optionally apply labels/reviewers from `.github/pr-meta.json`.
  - Optional cleanup of PR meta files when `vars.CLEANUP_PR_META == 'true'`.
- codex-review.yml
  - Add concurrency group `codex-${{ github.event.pull_request.number || github.ref }}`.
  - Add label `codex:review` on non-draft PRs; ping Codex for review.
  - Build frontend with Node 20; upload `frontend-dist` artifact from `frontend/dist`.
  - Print short bundle size summary.
- git-clean-merged.ps1
  - Add switches: `-Json`, `-Keep`, `-NoSwitch`, `-IncludeGone`, `-DryRun`.
  - Safety rails: protect base/dev/current; require `-Force` for risky deletions; exit codes 0/1/2.
  - Ahead-count checks; separate safe vs force deletions; deletion counter.
- TASK__git-preflight-action-postflight.md
  - Refresh task template/order to align with the automation.

Files
- .github/workflows/auto-open-pr.yml
- .github/workflows/codex-review.yml
- frontend/scripts/git-clean-merged.ps1
- docs/codex/TASK__git-preflight-action-postflight.md

Validation
- Branch: `chore/ci-codex-automation-hardening-2025-10-28` (matches auto-PR trigger).
- Expect two workflows: Auto open/update PR on push; Codex Review Prep on PR events.
- Artifact `frontend-dist` should be available; jobs green.

Notes
- If `CLEANUP_PR_META=true` (repo variable), the bot removes PR meta by a follow-up commit.

