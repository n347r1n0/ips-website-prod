# Avatar Upload RCA — draft apply on Save fails

## Summary (root cause)
При сохранении профиля с выбранным файлом всплывает тост «Не удалось подготовить аватар» — он генерируется в `AvatarField.applyDraft()` при любой ошибке подготовки/загрузки (см. `frontend/src/components/features/Profile/AvatarField.jsx:209–213`). На новой схеме без кнопки «Загрузить» подготовка/загрузка выполняются в момент нажатия общей кнопки «Сохранить» (см. `frontend/src/pages/DashboardPage.jsx:372–379` и обработчик `handleProfileUpdate`), и цепочка обрывается в двух типовых местах:

- `renderToCanvasBlob()` возвращает `null` (нет `imgRef`/натуральных размеров) → `throw new Error('Нет данных для загрузки')` → catch → тост «Не удалось подготовить аватар». См. `AvatarField.jsx:153–177, 197–213`.
- Ошибка Storage при `supabase.storage.from('avatars').upload(...)` (404/401/конфиг) → бросается `upErr` → catch → тот же тост. См. `AvatarField.jsx:199–206, 209–213`.

## How it should work (intended)
- Пользователь выбирает файл → поле держит черновик (file + crop state).
- По нажатию «Сохранить» страница вызывает `avatarRef.applyDraft()` →
  - canvas crop (512×512) → JPEG → upload в `avatars/users/${userId}/avatar_<ts>.jpg` → `getPublicUrl()` → возвращает `{ url }` → `update club_members.avatar_url`.

## How it currently runs on Save (actual)
- `DashboardPage.handleProfileUpdate` вызывает `applyDraft()` только на Save (`frontend/src/pages/DashboardPage.jsx:...` блок перед `update club_members`).
- В `applyDraft()` (`frontend/src/components/features/Profile/AvatarField.jsx:186–213`):
  - URL‑draft отрабатывает (возвращает url без загрузки).
  - File‑draft: требует валидные `imgRef`/`imgNatural` → `renderToCanvasBlob()` → upload → `getPublicUrl()`.
  - Любая ошибка в этом блоке ловится в `catch` с тостом «Не удалось подготовить аватар».

## Concrete failure points (code refs)
- Canvas prep:
  - `renderToCanvasBlob()` early return: `if (!imgRef.current || !imgNatural.w) return null;` → `AvatarField.jsx:154` → `if (!blob) throw new Error('Нет данных для загрузки');` → `AvatarField.jsx:198`.
  - Потенциальные причины: изображение ещё не успело загрузиться (нет `onImageLoad`), 0×0 размеры, редкий race Safari с `toBlob()`.
- Storage:
  - `upload(path, blob, { upsert:true })` → `upErr` при недоступном бакете/perms → `AvatarField.jsx:200–205`.
  - `getPublicUrl(path)` вернул объект без `data.publicUrl` → `throw new Error('Не удалось получить public URL')` → `AvatarField.jsx:205–207`.

## Why Telegram avatar works
Путь Telegram пишет готовый `avatar_url` без локальной подготовки/загрузки — цепочка canvas/upload не задействуется, поэтому ошибка не воспроизводится.

## Minimal fix plan (no code here, for next patch)
- Submit‑path: гарантировать подготовку перед upload:
  - Перед `ctx.drawImage` дождаться полной загрузки превью (`imgRef.current.complete && imgRef.current.naturalWidth > 0`) или `await imgRef.current.decode?.()` (с fallback).
  - В `renderToCanvasBlob()` добавить строгий fallback, если `toBlob` вернул `null` (повторный вызов через `toDataURL`), и защиту от выходов за границы исходника (кламп `sx/sy/sSize`).
- Storage‑path: 
  - Явно логировать/показывать тост типа «Хранилище не сконфигурировано» при `upErr` (401/404) и не маскировать под «Не удалось подготовить аватар».
- UI: автозагрузка выполняется ровно в `applyDraft()` на Save — оставляем как есть; кнопки «Загрузить» не возвращаем.

> Отчёт без изменений кода. Следующий PR: небольшая правка подготовки (decode/toBlob fallback) и явное различение ошибок Storage vs Canvas.

