// frontend/src/ui/patterns/AccordionPill.jsx

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * AccordionPill — «пилюля», раскрывающаяся вверх.
 *
 * Якорная схема без ограничений ширины:
 * ─ создаём нулевую по ширине опорную линию (anchor) по центру секции: right:50%, width:0;
 * ─ пилюля прижата к правому краю anchor (right:0) ⇒ не может выйти вправо от центра,
 *   ширина растёт только влево. Никаких translate/left-1/2 нет.
 */



 /**
 * ───────────────────────────────────────────────────────────────────────────────
 * Не удалять — Важное!!!
 * AccordionPill — почему текущее решение работает и какие подходы оказались плохими
 * ───────────────────────────────────────────────────────────────────────────────
 *
 * КОРОТКО (суть решения):
 * 1) Создаём «якорь-линию» по центру секции: абсолютный блок с right:50%, width:0, overflow:visible.
 *    Это нулевая по ширине вертикальная линия — геометрическая точка привязки.
 * 2) Пилюля позиционируется внутри якоря: position:absolute; right:0; bottom:0.
 *    ⇒ Правый край пилюли всегда совпадает с линией центра. Изменение width добавляет пиксели ТОЛЬКО влево.
 * 3) Ширину считаем программно: в закрытом состоянии = «естественная» ширина активного лейбла,
 *    в открытом = максимальная среди всех лейблов. Добавляем +2px буфера от субпикселей.
 *
 * ПОЧЕМУ ЭТО РАБОТАЕТ (без костылей):
 * • Привязка идёт не к центру блока (translateX), а к конкретному краю (right:0) внутри точки-якоря.
 * • Якорь нулевой ширины и не ограничивает пилюлю по max-width; overflow:visible у якоря
 *   позволяет пилюле уходить влево сколь угодно (пока родитель не режет слева).
 * • Нет трансформов, зависящих от текущей ширины. Точка привязки — чистый CSS-layout.
 *
 * ЧТО КАЗАЛОСЬ ОЧЕВИДНЫМ, НО ПЛОХО:
 * 1) Центрирование через left:50% + translateX(-50%) (+ «компенсации» extraW).
 *    — Это всегда крепит ЦЕНТР блока к точке. При изменении width блок растёт в обе стороны.
 *    — «Компенсации» через calc(-50% - extraW) хрупки: субпиксели, дрожание на transition, зависимость от измерений.
 *
 * 2) «Левая половина» контейнера (w-1/2) как жёсткая коробка.
 *    — Надёжно удерживает правый край, но вводит ИСКУССТВЕННЫЙ лимит ширины (не шире половины секции),
 *      усложняет верстку и создаёт лишнюю вложенность.
 *
 * 3) Вычислять правый якорь формулой (right = containerW - anchorX).
 *    — Работает, но избыточно: требует ResizeObserver/измерений, порядок эффектов, больше мест сломаться.
 *      То, что решается чистым CSS (right:50% у якоря), не надо переносить в JS.
 *
 * 4) Мерить ширину по offsetWidth у кнопки с w-full или с truncate на тексте.
 *    — w-full даёт ширину контейнера, а не «естественную» ширину текста.
 *    — truncate «подрезает» последний символ и ломает замер.
 *    — Правильно: offscreen-измеритель с теми же паддингами, без truncate; брать scrollWidth.
 *
 * ПРАКТИЧЕСКИЕ ПРАВИЛА:
 * • Нужно «расти только влево/вправо» — привязываем НУЖНЫЙ КРАЙ к опорной точке (right:0 или left:0)
 *   внутри якоря нулевой ширины. Не используем translateX для фиксации края.
 * • Измерения текста — только через offscreen-мерилку (одинаковые шрифты/паддинги), +1–2px буфера.
 * • Следить за родителями: overflow:hidden у внешних контейнеров может обрезать расширение слева —
 *   это уже вопрос макета, не пилюли.
 *
 * РАСШИРЕНИЕ НА БУДУЩЕЕ:
 * • Перенос опорной точки: заменить right:50% у якоря на вычисляемое значение или проп (anchorX/anchorPercent),
 *   сам принцип остаётся тем же (якорь width:0; пилюля right:0).
 *
 * ТРОБЛЬШУТИНГ:
 * • Видите «Главна..» → уберите truncate у активного лейбла, убедитесь в корректном offscreen-замере
 *   и оставьте +2px страховки к width.
 * • Пилюля «лезет вправо» → проверьте: якорь именно right:50%, width:0, пилюля right:0 (без translateX).
 * • Пилюля «режется слева» → ищите overflow:hidden у родителей и/или переносите якорь выше.
 * ───────────────────────────────────────────────────────────────────────────────
 */

export function AccordionPill({
  items = [],
  initialIndex = 0,
  rowHeight,         // если не передали — возьмём из токена
  maxRows = 6,
  className = '',
  icons = null,
  iconSize,          // если не передали — возьмём из токена
  iconGap,           // если не передали — возьмём из токена
  onSelect,          // (idx:number) => void (опц.) — сообщаем наружу выбор пункта
  onOpenChange,      // (open:boolean) => void (опц.) — сообщаем о смене open
  /** Сообщить родителю максимальную ширину ЗАКРЫТОЙ пилюли (px).
   *  Нужно 1 раз (и при редких пересчётах метрик/шрифтов), чтобы родитель
   *  мог правильно сместить якорь на +closedMax/2. */
  onMeasureClosedMax,
}) {

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(initialIndex);

  const labelRef = useRef(null);
  const wrapperRef = useRef(null);


  // Читать px-значение токена и парсить в число
  const readTokenPx = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const num = parseFloat(v);
    return Number.isFinite(num) ? num : fallback;
  };

  // Значения токенов → числа (px)
  const tokenRowH   = rowHeight ?? readTokenPx('--acc-pill-row-h', 40);
  const tokenIconSz = iconSize  ?? readTokenPx('--acc-pill-icon-size', 18);
  const tokenIconGp = iconGap   ?? readTokenPx('--acc-pill-icon-gap', 8);


  // Геометрия «шапки»
  const [labelH, setLabelH] = useState(0);



  const [pillRadiusPx, setPillRadiusPx] = useState(22);   // старт: 44/2, чтобы не было фолбека
  const radiusFrozenRef = useRef(false);                   // как только посчитали корректно — больше не менять





  // Динамическая ширина текста (без иконок)
  const [labelW, setLabelW] = useState(0); // ширина активного лейбла (text + paddings)
  const [maxW, setMaxW] = useState(0);     // максимальная ширина среди всех лейблов

  const measureBoxRef = useRef(null);      // offscreen-измеритель

  const lastClosedMaxRef = useRef(null);   // дедупликация колбэка наверх


  // Унифицированный пересчёт ширин (активный лейбл + максимум среди всех)
  const recomputeWidths = () => {
    const box = measureBoxRef.current;
    if (!box) return;

    // maxW
    const nodes = box.querySelectorAll('[data-measure="label"]');
    let max = 0;
    nodes.forEach((n) => { max = Math.max(max, Math.ceil(n.scrollWidth || 0)); });

    // labelW (по активному)
    const n = box.querySelector(`[data-idx="${active}"]`);
    const lw = n ? Math.ceil(n.scrollWidth || 0) : 0;

    setMaxW(max);
    setLabelW(lw);

    // ── сообщаем наверх «максимальную ширину закрытой пилюли»
    // ВАЖНО: формула закрытой ширины сейчас = labelW - 2 (см. ниже closedWidth)
    // Значит для «максимально возможной закрытой» берём maxW - 2.
    // Это число родитель использует ТОЛЬКО для сдвига якоря (= closedMax/2).
    if (typeof onMeasureClosedMax === 'function') {
      const closedMaxPx = Math.max(0, max - 2);
      if (closedMaxPx !== lastClosedMaxRef.current) {
        lastClosedMaxRef.current = closedMaxPx;
        try { onMeasureClosedMax(closedMaxPx); } catch {}
      }
    }
  };


  // Закрытие по клику вне и Esc
  useEffect(() => {
    if (!open) return;
    const onDocDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDocDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Репортим внешнему миру смену открытости
  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // Высота шапки
  useEffect(() => {
    if (labelRef.current) setLabelH(labelRef.current.offsetHeight || 0);
  }, [open]);

  // Фиксируем радиус = высота закрытой пилюли / 2 (только пока закрыта и ещё не заморожено)
  useLayoutEffect(() => {
    if (open || radiusFrozenRef.current) return;
    if (!wrapperRef.current) return;
    const h = wrapperRef.current.offsetHeight || 0;
    if (h > 0) {
      const r = Math.round(h / 2);
      if (pillRadiusPx !== r) setPillRadiusPx(r);
    }
  }, [open, labelH, pillRadiusPx]);

  // Как только пользователь впервые открыл пилюлю — фиксируем радиус навсегда
  useEffect(() => {
    if (open) {
      radiusFrozenRef.current = true;
    }
  }, [open]);


  // Пересчёт ширин при смене активного или списка
  useLayoutEffect(() => {
    recomputeWidths();
  }, [active, items]);


  // После загрузки шрифтов метрики меняются — пересчитать ширины
  useEffect(() => {
    let cancelled = false;

    // 1) document.fonts.ready — один раз, когда все матчи шрифтов готовы
    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
      document.fonts.ready.then(() => {
        if (!cancelled) recomputeWidths();
      });
    }

    // 2) На случай динамической подзагрузки начертаний
    const onFontsDone = () => recomputeWidths();
    if (document.fonts && typeof document.fonts.addEventListener === 'function') {
      document.fonts.addEventListener('loadingdone', onFontsDone);
    }

    return () => {
      cancelled = true;
      if (document.fonts && typeof document.fonts.removeEventListener === 'function') {
        document.fonts.removeEventListener('loadingdone', onFontsDone);
      }
    };
  }, [active, items]);

  // 3) Если мерилка изменила размеры (напр. от шрифта) — пересчитать
  useEffect(() => {
    const box = measureBoxRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => recomputeWidths());
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // Шрифты могут изменить высоту шапки → одно уточнение радиуса до первого открытия
  useEffect(() => {
    if (!document.fonts?.ready) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled || open || radiusFrozenRef.current || !wrapperRef.current) return;
      const h = wrapperRef.current.offsetHeight || 0;
      if (h > 0) setPillRadiusPx(Math.round(h / 2));
    });
    return () => { cancelled = true; };
  }, [open]);




  // Высота раскрытия контента
  const rows = Math.min(items.length - 1, maxRows);
  const listMaxH = Math.max(0, rows * tokenRowH);

  const visibleCount = Math.max(0, items.length - 1);
  const needScrollbar = visibleCount > maxRows;

  // Есть ли вообще хоть одна иконка
  const hasAnyIcon = Array.isArray(icons) && icons.some(Boolean);
  // Слот для иконки (фикс), добавляем только когда пилюля ОТКРЫТА и есть хотя бы одна иконка
  const iconSlot = open && hasAnyIcon ? (tokenIconSz + tokenIconGp) : 0;

  // Итоговая ширина «пилюли»
  const closedWidth = labelW - 2;          // твой текущий буфер
  const openWidth   = Math.max(labelW, maxW) + iconSlot -2;        // резерв под иконки + буфер
  const pillWidth   = open ? openWidth : closedWidth;

  return (
    <div className={twMerge('h-[44px] relative font-ui-role', className)} aria-live="polite">
      {/* Offscreen-измеритель ширины ЛЕЙБЛОВ (без иконок!) */}
      <div aria-hidden className="absolute opacity-0 pointer-events-none -z-10 top-0 left-0">
        <div ref={measureBoxRef} className="whitespace-nowrap">
          {items.map((label, idx) => (
            <div
              key={`m-${label}`}
              data-measure="label"
              data-idx={idx}
              className="inline-block px-[var(--acc-pill-px)] py-[var(--acc-pill-py)]"
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Якорь-линия: по центру секции */}
      <div
        className="absolute bottom-0 right-1/2"
        style={{ width: 0, overflow: 'visible', pointerEvents: 'none' }}
      >
        {/* Пилюля: правый край приклеен к центру, рост ширины — только влево */}
        <div
          ref={wrapperRef}
          className={twMerge(
            'absolute right-0 bottom-0 z-[45] pointer-events-auto',
            'flex flex-col-reverse',
            'isolate bg-clip-padding',
            'bg-[--glass-bg] backdrop-blur-[var(--glass-blur)] shadow-[var(--shadow-s)]',
            'transition-[max-height,width] duration-200 ease-out'
          )}
          style={{
            maxHeight: open ? labelH + listMaxH : labelH || 44,
            width: `${pillWidth}px`,
            overflow: 'hidden',
            transformOrigin: 'bottom',
            willChange: 'max-height',
            borderRadius: `${pillRadiusPx}px`,
            boxShadow: 'inset 0 0 0 0.5px var(--acc-pill-glass-border)',
            border: 'none',
            '--icon-slot': open && hasAnyIcon ? `${tokenIconSz + tokenIconGp}px` : '0px',
            '--ring': '0 0 0 0 rgba(0,0,0,0)',
          }}
          role="group"
          aria-label="Навигация (пилюля)"
        >
          {/* Шапка / текущая секция */}
          <button
            ref={labelRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={twMerge(
              'w-full relative flex items-center justify-start text-left',
              'px-[var(--acc-pill-px)] py-[var(--acc-pill-py)]',
              'text-[--fg-strong]',
              'hover:bg-white/8 focus:outline-none focus:[box-shadow:var(--ring)]',
            )}
            style={{
                paddingLeft: `calc(var(--acc-pill-px) + var(--icon-slot))`,
            }}
            aria-expanded={open}
            aria-controls="accordion-pill-list"
          >

            {/* 3D-капсула-декор: фон+внутренние тени */}
            <span
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: `${pillRadiusPx}px`,
                background: 'var(--acc3d-fill)',
                boxShadow: 'var(--acc3d-inset-light), var(--acc3d-inset-dark), var(--acc3d-drop)',
                // border: 'var(--acc3d-border)', // при желании включить кант; сейчас избегаем «двойного» бордера
                zIndex: 0,
              }}
            />
            {/* Узкий верхний блик */}
            <span
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: `${pillRadiusPx}px`,
                background: 'var(--acc3d-top-gloss)',
                zIndex: 1,
              }}
            />

            {/* Иконка у активного пункта — только когда ОТКРЫТО и иконки есть */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2"
              style={{
                left: 'var(--acc-pill-px)',
                width: tokenIconSz,
                height: tokenIconSz,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: open && hasAnyIcon && icons?.[active] ? 1 : 0,
                transition: 'opacity 160ms ease-out',
                zIndex: 2,
              }}
            >
              {icons?.[active] ?? null}
            </span>
            <span className="whitespace-nowrap relative z-[2]">{items[active]}</span>
          </button>

          {/* Контент аккордеона */}
          <div id="accordion-pill-list" className="w-full" aria-hidden={!open}>
            <div
              className={twMerge(needScrollbar ? 'overflow-y-auto' : 'overflow-hidden')}
              style={{ maxHeight: open ? listMaxH : 0, transition: 'max-height 200ms ease-out' }}
              role="listbox"
            >
              {items.map((label, idx) => {
                if (idx === active) return null; // активный в шапке
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setActive(idx);
                      onSelect?.(idx);
                      setOpen(false);
                    }}
                    className={twMerge(
                      'w-full relative flex items-center px-[var(--acc-pill-px)] text-left',
                      'text-[--fg] hover:bg-white/8 focus:bg-white/8',
                      'focus:outline-none focus:[box-shadow:var(--ring)]'
                    )}
                    role="option"
                    style={{
                      height: 'var(--acc-pill-row-h)',
                      // в списке мы всегда в открытом состоянии → сразу резервируем место под иконку
                      paddingLeft: 'calc(var(--acc-pill-px) + var(--icon-slot))',
                    }}
                  >
                    {/* Иконка слева — только когда открыто и иконка есть */}

                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2"
                      style={{
                        left: 'var(--acc-pill-px)',
                        width: tokenIconSz,
                        height: tokenIconSz,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: hasAnyIcon && icons?.[idx] ? 1 : 0,
                        transition: 'opacity 160ms ease-out',
                      }}
                    >
                      {icons?.[idx] ?? null}
                    </span>
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* /Пилюля */}
      </div>
      {/* /Anchor line */}
    </div>
  );
}

export default AccordionPill;
