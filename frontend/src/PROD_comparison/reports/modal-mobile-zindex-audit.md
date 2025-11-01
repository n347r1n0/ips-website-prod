# Modal (Mobile) Z‑Index Audit — iOS Safari

## Токены слоёв (найдено/используется)

- Специальных z‑токенов (например, `--z-header`, `--z-modal`) в PROD не найдено.
- Фактические слои заданы числовыми классами Tailwind и кастомными классами:
  - Header: `z-50` — `frontend/src/components/layout/Header.jsx:34`.
  - Modal (overlay, окно):
    - overlay (windowed): `z-40` или `z-[60]` при `priority` — `frontend/src/components/ui/ModalBase/ModalBase.jsx:121`.
    - fullScreen контейнер: `.neumorphic-container { z-index: 40; }` — `frontend/src/styles/panels.css:62`.
  - Toast: `z-[100]` — `frontend/src/components/ui/Toast.jsx:52`.
  - Другие паттерны: локальные `z-[45]`, `z-[60]`, `z-[70]` и т.п.

## ModalBase / портал

- Портал монтируется в `document.body`, если `usePortal` или `priority` — `frontend/src/components/ui/ModalBase/ModalBase.jsx:170`.
- Ветка `fullScreen` рендерит контейнер `.neumorphic-container` без overlay‑обёртки (`fixed inset-0 ... z-*` отсутствует) — `ModalBase.jsx:93–110`.
- Стили `.neumorphic-container`:
  - `position: fixed; top/left/right/bottom: 0; height: 100dvh; z-index: 40;` — `frontend/src/styles/panels.css:50–66`.
- В «окном» (не fullScreen) модалка использует overlay `fixed inset-0` с `z-40`/`z-[60]` (при `priority`) — `ModalBase.jsx:113–141`.

## Header (мобайл)

- Header фиксированный: `class="fixed ... z-50 ..."` — `frontend/src/components/layout/Header.jsx:34`.
- Присутствуют эффекты `backdrop-blur`/`bg-*`, но портал модалки в `body`, поэтому главным остаётся сравнение `z-index`.

## Причина

- На мобайле включается `fullScreen`, и модалка — это `.neumorphic-container` с `z-index: 40` (panels.css:62). Шапка — `z-50` (Header.jsx:34). Поэтому на iOS Safari (и в целом на мобайле) шапка оказывается поверх модалки.
- На десктопе используется ветка с overlay: при `priority` overlay получает `z-[60]`, что выше `z-50` у шапки; поэтому там всё корректно.

## Варианты фикса A/B/C (минимальные), риски

- A) Портал: оставить монтирование в `document.body` (уже так при `usePortal`/`priority`) и унифицировать слой fullScreen с overlay‑веткой: применить тот же верхний слой для fullScreen (см. B/C). Риск: пересечение с подсказками/дропдаунами, если у тех есть `z≥60`.
- B) Слой модалки: привести `.neumorphic-container` к слою модалки, который строго выше шапки (например, `z-[60]` при `priority`). Риск: модалка перекроет локальные оверлеи (dropdown, wheel), если они `z<60`.
- C) Токенизация: завести токены слоёв (например, `--z-header: 50; --z-modal: 60; --z-toast: 100;`) и использовать их в `ModalBase`/`.neumorphic-container`. Риск: потребуется одноразовая замена чисел на токены в затронутых слоях.

## Рекомендация

Начать с B/C: согласовать единый слой для модалки на мобайле (fullScreen) равный десктопному overlay при `priority` (условно `--z-modal: 60`) и применить его к `.neumorphic-container`. Портал в `document.body` уже корректен.

