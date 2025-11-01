# WSL Networking + GitHub Auth — Quick Checklist

This note captures the minimal steps we used to restore networking and GitHub auth in WSL without touching the repo.

## DNS / Network
- Verify internet by IP: `curl -I https://1.1.1.1 --max-time 5`
- If name resolution fails (`Could not resolve host`):
  - Restart WSL from Windows PowerShell: `wsl --shutdown` (close IDE/VPN first), then reopen.
  - Don't edit `/etc/hosts` or require sudo fixes; prefer host‑side restart.
- Healthcheck (WSL):
  - `cat /etc/resolv.conf` (stub or valid resolvers)
  - `resolvectl status` (Link Scopes should not be `none`)
  - `curl -I https://github.com --max-time 5`

## GitHub Auth (WSL‑local)
- Use system gh: `command -v gh && gh --version` (we pin `/usr/bin/gh`).
- Configure a single helper:
  - `git config --global --unset-all credential.helper || true`
  - `git config --global credential.helper '!gh auth git-credential'`
- Device flow (prints code + URL):
  - `gh auth login -h github.com -p https -w -s repo,read:org`
  - Open `https://github.com/login/device` and enter the code.
- Verify: `gh auth status -h github.com` (Logged in …), `~/.config/gh/hosts.yml` exists.

## Push (triggers auto‑PR)
- `git remote -v && git status -sb`
- `git push -u origin <branch>`
- Confirm branch: `git ls-remote --heads origin <branch>`
- Our Action “Auto open/update PR on branch push” reads `.github/pr.md` and `.github/pr-meta.json` to create/update PR.

> Tip: Avoid mixing Windows credentials with WSL — log in with gh inside WSL so git in WSL picks up credentials from `~/.config/gh/hosts.yml`.

