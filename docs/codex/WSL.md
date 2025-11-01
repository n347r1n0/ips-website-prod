# WSL → GitHub push: быстрый чек‑лист и починка

## 0) Симптомы

* `git push` → **Could not resolve host: github.com** / 401 без запроса логина.
* `curl -I https://github.com` → «Could not resolve host».
* `getent hosts github.com` → пусто.

Причины обычно две:

1. **DNS в WSL сломан**: `/etc/resolv.conf` указывает на `127.0.0.53` (stub) без аплинка — частая история после сна/переключений VPN.
2. **Нет аутентификации в САМОМ WSL**: git не видит токен (помощник credential manager не настроен), особенно если раньше логинились только в Windows.

---

## 1) Починка DNS (надёжный путь)

**Внутри WSL:**

```bash
# Разрешаем WSL автоматически генерировать resolv.conf при старте
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[network]
generateResolvConf=true
EOF

# Убираем текущий повреждённый resolv.conf
sudo rm -f /etc/resolv.conf
exit
```

**В Windows PowerShell:**

```powershell
wsl --shutdown
```

Запустите WSL снова и проверьте:

```bash
cat /etc/resolv.conf          # должен быть нормальный DNS (обычно адрес виртуального свитча/VPN)
getent hosts github.com | head -1
curl -I https://github.com --max-time 5
```

Если всё ещё не резолвит, временный fallback (будет перезатёрт при следующем рестарте WSL):

```bash
echo -e "nameserver 1.1.1.1\nnameserver 8.8.8.8\noptions timeout:2 attempts:2" | sudo tee /etc/resolv.conf
```

> Примечание: проблемы часто связаны с VPN. Если после его включения/выключения DNS снова ломается — просто повторите `wsl --shutdown` (быстрый и чистый способ починки).

---

## 2) Логин GitHub именно в WSL

Зафиксируйте один `gh` и свяжите `git` с его кредами:

```bash
which gh && gh --version        # напр. /usr/bin/gh

# Пусть git берёт токен из gh
git config --global credential.helper '!gh auth git-credential'

# Логин через device‑flow (печатает код в терминал, открывает браузер)
gh auth login -h github.com -p https -w -s repo,read:org
# После подтверждения кода:
gh auth status -h github.com     # Должно быть: Logged in to github.com
```

**Важно:**

* Не смешивайте `/usr/bin/gh` и `~/.local/bin/gh` одновременно.
* Старые флаги `--device/--git` в некоторых версиях `gh` отсутствуют. Используйте `-w` и helper `!gh auth git-credential` как выше.
* Авторизация браузером в Windows корректна: код привяжет **WSL‑gh** к вашему аккаунту, токен ляжет в `~/.config/gh/hosts.yml`.

---

## 3) Проверка и push

```bash
git remote -v
git status -sb
# Проверяем доступность
git ls-remote https://github.com/<owner>/<repo>.git | head -3

# Пуш
git push -u origin <branch>
```

Если в репозитории настроен Action «Create or update PR», он сам откроет/обновит PR, читая `.github/pr.md` и лейблы из `.github/pr-meta.json`.

---

## 4) Мини‑healthcheck (на память)

```bash
# DNS
getent hosts github.com | head -1 || echo "DNS: NO RESOLVE"
# gh‑логин
gh auth status -h github.com || echo "GH: NOT LOGGED"
# helper
git config --global credential.helper
```

Ожидаемо: есть A‑запись для github.com, статус Logged in, helper = `!gh auth git-credential`.

---

## 5) Частые ловушки

* **Включили/выключили VPN** → сломался DNS → лечится `wsl --shutdown`.
* `curl` работает, а `git push` просит пароль → **не настроен helper**. Настройте `git config --global credential.helper '!gh auth git-credential'` и повторите `gh auth login` в WSL.
* Разные версии `gh` в PATH → непредсказуемо. Держите один (`/usr/bin/gh`) и проверяйте `which gh`.
* Device‑код истёк (обычно ~10–15 мин) → перезапустите `gh auth login`.
* Постоянно правите `/etc/resolv.conf` вручную — он перегенерируется. Для стабильности используйте `generateResolvConf=true` и просто перезапускайте WSL при сбоях.

---

## 6) Короткий «плейбук» действий

1. **Нет резолва** → `wsl --shutdown` (после `sudo rm /etc/resolv.conf` при необходимости) → проверить `getent`/`curl`.
2. **Нет авторизации** → `git config --global credential.helper '!gh auth git-credential'` → `gh auth login -h github.com -p https -w -s repo,read:org` → `gh auth status`.
3. **Пуш** → `git push -u origin <branch>` → проверить, что PR открылся автоматически.
