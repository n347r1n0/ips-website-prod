# chore(ci/git): auto-open PR on push + PR-meta cleanup; add local cleanup script & docs

## What this PR does
- **CI**: adds `auto-open-pr.yml` — opens/updates a PR automatically on any push to `feat/*`, `fix/*`, `chore/*`, `refactor/*`.
- **PR meta**: reads title/body from `.github/pr.md` (or `.github/pr-title.txt` + `.github/pr-body.md`); optional labels/reviewers from `.github/pr-meta.json`.
- **Cleanup**: if repo var `CLEANUP_PR_META=true`, meta files are auto-removed in a follow-up commit after PR creation.
- **Docs**: developer notes for CODEX/tasks — `docs/codex/TASK__git-preflight-action-postflight.md`.
- **Local helper**: `frontend/scripts/git-clean-merged.ps1` + note `docs/GIT__post-merge_local-cleanup.md` to safely prune merged local branches.

## Why
- Reduce friction when CODEX/you push feature branches — PR opens itself with curated title/body.
- Keep repo clean (no lingering meta files) while still allowing rich PR templates per-branch.

## How to validate
1. Push to this branch — check **Actions** → run of *Auto open/update PR on branch push*.
2. Ensure PR is opened/updated against `main` with this title/description.
3. Check the branch tip: one extra commit “chore(pr): remove PR meta after PR #N” removes meta files.

## Notes
- Base branch fixed to `main` by design (can be generalized later).
- If you want labels/reviewers — add `.github/pr-meta.json` before push.
