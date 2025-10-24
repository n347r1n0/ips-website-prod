// frontend/src/ui/skins/wheels/pokerSkin.jsx
import React from 'react';
import { resolvePresets } from './pokerSkin.presets';

/**
 * Poker-chip skin (seamless, token-friendly).
 *
 * Кольцо:
 *  • Узoр клиньев — один repeating-conic-gradient (бесшовный).
 *  • Фаза узора = center + phaseDeg − stepF*stepDeg (жёстко привязана к ленте иконок).
 *  • Стекло — отдельный слой backdropFilter под узором.
 *  • Разделители — второй repeating-conic поверх (тонкие линии).
 *
 * Центр:
 *  • 'bowl'  — мягкая вогнутая чаша (без изменений).
 *  • 'bezel' — ЦЕНТРАЛЬНЫЙ ДИСК как был + ПОД НИМ большой диск с inset-тенями (без «кромок»).
 *
 * Активная иконка:
 *  • Прозрачная золотая подложка-«колечко» + мягкий glow + масштаб.
 *  • Цвет глифа можно переключать на золотой или оставить белым.
 */
export const pokerSkin = {
  // ─────────────────────────────────────────────────────────
  // СЛОИ ДО ИКОНОК
  beforeIcons(geom, props = {}) {
    const { size, center, stepDeg, stepF } = geom;

    // Пресеты
    const { palette, center: centerPreset } = resolvePresets(props);

    // ╭───────────────────── КОНТРОЛИ (с комментариями) — действующие пропсы ─────────────────────╮
    const {
      // 🧭 Геометрия кольца
      rimWidth = 26,           // толщина цветного обода (px)
      gapDeg = 2,              // ширина разделителя между клиньями (deg)
      visualWedgeDeg = null,   // ширина «видимого» клина (deg); если null — = stepDeg
      phaseDeg = 0,            // подстройка фазы узора (совпадение иконки и клина)
      overlapDeg = 0.0,        // небольшое «налезание» клина на соседа против щелей (deg)

      // 🪟 Стекло (под узором; влияет на фон под кольцом)
      blurPx = 8,
      saturate = 1.12,
      brighten = 1.04,

      // ┆ Разделители клиньев
      showGaps = true,
      gapAlpha = 0.28,

      // ⚪ Центр (вариант визуала)
      centerStyle = centerPreset.style,                    // 'bowl' | 'bezel'
      cupInnerR = Math.round(size * centerPreset.innerR),  // радиус центрального диска (px)
      cupRimThicknessPx = Math.max(2, Math.round(size * centerPreset.rimThickness)), // не используется в bezel

      // 🎨 Палитра кольца (можно переопределить любые из пресета)
      red     = palette.red,
      ivory   = palette.ivory,
      tintAlphaRed   = palette.tintAlphaRed,
      tintAlphaIvory = palette.tintAlphaIvory,
      baseDark  = palette.baseDark,   // база под стеклом
      baseDark2 = palette.baseDark2,

      // — НАСТРОЙКИ ПОДЛОЖКИ ПОД ЦЕНТРАЛЬНЫМ ДИСКОМ (только для 'bezel') —

      underDiskEnabled = true,   // рисовать ли круг-подложку под центральным диском
      underDiskExtraPx = 14,     // ширина видимой «полки» вокруг центрального диска (px)
      underDiskFill = null,      // если задано — используем как есть (сплошной цвет или градиент)
      underDiskMatch = 'none',   // 'none' | 'red' | 'ivory' — взять оттенок, как у клиньев (через те же альфы)
      underDiskBlurPx = 12,      // радиус размытия inset-теней (px)
      underDiskInsetDark = 0.55, // тёмная внутренняя тень (alpha 0..1)
      underDiskInsetLight = 0.22,// тонкий светлый кант изнутри (alpha 0..1)


      underDiskBrightness = 1.0, // 0.7..1.3 — равномерно темнее/светлее нижнего диска

      // DROP-тени ОТ центрального диска НА нижний (в режиме 'bezel')
      centerDropDarkAlpha = 0.28,
      centerDropDarkBlur  = 16,  // px
      centerDropLightAlpha = 0.10,
      centerDropLightBlur  = 8,  // px

      // Кант у центрального диска (тонкий светлый «ободок» изнутри)
      centerInsetLight = 0.18,   // 0..1 (0 — выкл)

      // Инверсия шейдинга центрального диска (светлые края, тёмный центр)
      centerInvertShading = false,





      // ✨ Активная иконка (визуальный акцент)
      activeIcon = {
        ringEnabled: true,
        ringAlpha: 0.18,
        ringRadiusPx: 20,
        ringSoftPx: 10,
        scale: 1.2,
        glow: 0.30,
        insetGlow: 0.12,
        glyph: 'inherit',
        activeGlyphColor: 'var(--gold, #D4AF37)',

        // ── новая «капсула» из золотого стекла
        capEnabled: true,
        capTint: 'var(--gold, #D4AF37)',
        capDiameterPx: null,     // если null — возьмём из chipSize * 1.55
        capFillAlpha: 0.22,      // плотность «стекла»
        capHighlightAlpha: 0.14, // внутренний блик
        capHighlightBias: 0.46,  // 0..1 — смещение блика к верху
        capBorderAlpha: 0.28,    // тонкий контур (hairline)
        capGlowAlpha: 0.18,      // внешнее мягкое свечение капсулы
      },
    } = props;
    // ╰────────────────────────────────────────────────────────────────────────────────────────────╯

    const outerR = size / 2;
    const innerR = Math.max(0, outerR - rimWidth);

    const wedgeBase = (visualWedgeDeg ?? stepDeg);
    const wedgeDeg  = Math.max(0, wedgeBase - gapDeg);
    const period    = 2 * wedgeBase; // красный + светлый
    const phase     = center + phaseDeg - stepF * stepDeg;

    const withAlpha = (c, a) => `color-mix(in oklab, ${c} ${Math.round(a * 100)}%, transparent)`;
    const redTint   = withAlpha(red,   tintAlphaRed);
    const ivoryTint = withAlpha(ivory, tintAlphaIvory);

    // Ограничение: всё рисуем ТОЛЬКО на кольце
    const ringMask = `radial-gradient(circle at 50% 50%, transparent ${innerR - 0.5}px, black ${innerR}px)`;

    // База под стеклом
    const baseLayer = (
      <div
        key="disk:base"
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(80% 80% at 50% 42%, ${baseDark} 0%, ${baseDark2} 72%, #000 100%)`,
          boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
        }}
      />
    );

    // Стекло
    const glassLayer = (
      <div
        key="ring:glass"
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          WebkitMask: ringMask,
          mask: ringMask,
          backdropFilter: `blur(${blurPx}px) saturate(${saturate}) brightness(${brighten})`,
        }}
      />
    );

    // Узoр клиньев (бесшовный)
    const tintLayer = (
      <div
        key="ring:tint"
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          WebkitMask: ringMask,
          mask: ringMask,
          background: `
            repeating-conic-gradient(
              from ${phase - overlapDeg}deg,
              ${redTint} 0deg,
              ${redTint} ${wedgeDeg + overlapDeg}deg,
              transparent ${wedgeDeg + overlapDeg}deg,
              transparent ${wedgeDeg + gapDeg - overlapDeg}deg,
              ${ivoryTint} ${wedgeDeg + gapDeg - overlapDeg}deg,
              ${ivoryTint} ${wedgeDeg + gapDeg + wedgeDeg}deg,
              transparent ${wedgeDeg + gapDeg + wedgeDeg}deg,
              transparent ${period}deg
            )
          `,
        }}
      />
    );

    // Разделители
    const gapsLayer = showGaps ? (
      <div
        key="ring:gaps"
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          WebkitMask: ringMask,
          mask: ringMask,
          background: `
            repeating-conic-gradient(
              from ${phase}deg,
              transparent 0deg,
              transparent ${wedgeDeg}deg,
              rgba(255,255,255,${gapAlpha}) ${wedgeDeg}deg,
              rgba(255,255,255,${gapAlpha}) ${wedgeDeg + gapDeg}deg,
              transparent ${wedgeDeg + gapDeg}deg,
              transparent ${wedgeDeg + gapDeg + wedgeDeg}deg,
              rgba(255,255,255,${gapAlpha}) ${wedgeDeg + gapDeg + wedgeDeg}deg,
              rgba(255,255,255,${gapAlpha}) ${period}deg
            )
          `,
        }}
      />
    ) : null;

    // Внутренняя тень по ободу
    const innerShadow = (
      <div
        key="ring:inner-shadow"
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          WebkitMask: ringMask,
          mask: ringMask,
          boxShadow: 'inset 0 10px 24px rgba(0,0,0,0.45)',
        }}
      />
    );

    // Центр
    const centerLayers = (() => {
      const inner = cupInnerR;                // радиус центрального диска
      const underR = inner + Math.max(0, underDiskExtraPx); // радиус подложки (только для 'bezel')

      if (centerStyle === 'bezel') {
        return (
          <div key="center:bezel" className="absolute inset-0 pointer-events-none">


            {/* 1) ПОДЛОЖКА — бОльший диск с симметричными inset-тенями (без масок/блендов) */}
            {underDiskEnabled && (() => {
              const grow = Math.max(0, underDiskExtraPx);
              const w = (inner + grow) * 2;
              const h = w;

              // как красный/ivory клин «через стекло» — берём те же тины, что и клинья
              const matched = underDiskMatch === 'red'   ? redTint
                            : underDiskMatch === 'ivory' ? ivoryTint
                            : null;

              // итоговая заливка подложки:
              // 1) если задан underDiskFill — используем как есть (цвет/градиент);
              // 2) если underDiskMatch — используем matched-цвет (плюс лёгкая деградация к тёмному по краю);
              // 3) иначе — неброский титановый градиент из пресета.
              const baseUnder =
                underDiskFill ? underDiskFill
                : matched
                ? `radial-gradient(75% 75% at 50% 50%,
                    ${matched} 0%,
                    color-mix(in oklab, ${matched} 70%, black) 100%)`
                : (palette?.underDiskFill ?? `radial-gradient(75% 75% at 50% 50%,
                    color-mix(in oklab, var(--bg-0, #0B0D12) 86%, white 14%) 0%,
                    color-mix(in oklab, var(--bg-0, #0B0D12) 76%, white 24%) 45%,
                    color-mix(in oklab, var(--bg-0, #0B0D12) 58%, black 42%) 100%)`);

              return (
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: w, height: h,

                    background: baseUnder,          // ← сплошной цвет или «совпадающий» с клиньями

                    filter: `brightness(${underDiskBrightness})`,

                    // две симметричные inset-тени: тёмная «в глубину» и тонкий светлый кант
                    boxShadow: `
                      inset 0 0 ${underDiskBlurPx}px rgba(0,0,0,${underDiskInsetDark}),
                      inset 0 0 0 1px rgba(255,255,255,${underDiskInsetLight})
                    `,
                  }}
                />
              );
            })()}



            {/* 2) ЦЕНТРАЛЬНЫЙ ДИСК — как был (титановый). БЕЗ внешней тени (drop) на этом шаге */}

            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: inner * 2,
                height: inner * 2,
                // ВАЖНО: без rgba/альфы — чисто непрозрачный градиент



                background: centerInvertShading
                  ? `radial-gradient(85% 85% at 50% 50%,
                       color-mix(in oklab, var(--bg-0, #0B0D12) 68%, black 32%) 0%,
                       color-mix(in oklab, var(--bg-0, #0B0D12) 80%, white 20%) 100%
                     )` // свет по краям, темнее к центру
                  : `radial-gradient(75% 75% at 50% 45%,
                       color-mix(in oklab, var(--bg-0, #0B0D12) 84%, white 16%) 0%,
                       color-mix(in oklab, var(--bg-0, #0B0D12) 90%, white 10%) 45%,
                       color-mix(in oklab, var(--bg-0, #0B0D12) 65%, black 35%) 100%
                     )`,
                // ВНЕШНИЕ DROP-ТЕНИ (падают на нижний диск) + ТОНКИЙ СВЕТЛЫЙ КАНТ изнутри
                boxShadow: `
                  0 0 ${centerDropDarkBlur}px rgba(0,0,0,${centerDropDarkAlpha}),
                  0 0 ${centerDropLightBlur}px rgba(255,255,255,${centerDropLightAlpha}),
                  inset 0 0 0 1px rgba(255,255,255,${centerInsetLight}),
                  inset 0 8px 18px rgba(0,0,0,0.35)
                `,

                // защита от смешивания
                mixBlendMode: 'normal'
              }}
            />
          </div>
        );
      }

      // bowl — без изменений
      const rimSize = cupRimThicknessPx;
      const rimOuter = inner + rimSize;
      const rimMask = `radial-gradient(circle at 50% 50%,
        transparent ${inner - 0.5}px,
        black ${inner}px,
        black ${rimOuter}px,
        transparent ${rimOuter + 0.5}px)`;

      return (
        <div key="center:bowl" className="absolute inset-0 pointer-events-none">
          {/* Светлая кромка */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              WebkitMask: rimMask,
              mask: rimMask,
              background: `linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))`,
              opacity: 0.9,
            }}
          />
          {/* Halo над кромкой */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              WebkitMask: `radial-gradient(circle at 50% 50%,
                transparent ${inner - 2}px,
                rgba(255,255,255,0.8) ${inner + 2}px,
                transparent ${rimOuter + 8}px)`,
              mask: `radial-gradient(circle at 50% 50%,
                transparent ${inner - 2}px,
                rgba(255,255,255,0.8) ${inner + 2}px,
                transparent ${rimOuter + 8}px)`,
            }}
          />
          {/* Сердцевина — вогнутая */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: inner * 2,
              height: inner * 2,
              background:
                'radial-gradient(75% 75% at 50% 40%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 35%, rgba(0,0,0,0.65) 100%)',
              boxShadow: 'inset 0 8px 20px rgba(0,0,0,0.55)',
            }}
          />
        </div>
      );
    })();

    return (
      <div className="absolute inset-0 rounded-full pointer-events-none">
        {baseLayer}
        {glassLayer}
        {tintLayer}
        {gapsLayer}
        {innerShadow}
        {centerLayers}
      </div>
    );
  },

  // ─────────────────────────────────────────────────────────
  // СЛОИ ПОСЛЕ ИКОНОК (сейчас не нужны)
  afterIcons() {
    return null;
  },

  // ─────────────────────────────────────────────────────────
  // ОБЁРТКА ПОДПИСИ (надпись поверх центра)
  CenterLabelWrap(_g, _p, children) {
    return (
      <div className="relative z-[2] text-[--fg-strong] font-semibold tracking-wide font-ui-role">
        {children}
      </div>
    );
  },

  // ─────────────────────────────────────────────────────────
  // ДЕКОР АКТИВНОЙ ИКОНКИ
  decorateIcon(node, { isActive, geometry, skinProps }) {
    const a = skinProps?.activeIcon || {};
    const {

      // NEW: сплошная подложка под иконкой
      fillEnabled = true,
      fillAlpha = 0.02,            // 0..1 — непрозрачность «стекла»
      fillRadiusPx = 14,           // радиус подложки
      // NEW: тонкий контур поверх подложки
      strokeEnabled = true,
      strokeAlpha = 0.03,
      strokeWidthPx = 0.5,
      // Halo-кольцо (мягкое внешнее сияние)
      ringEnabled = true,
      ringAlpha = 0.02,
      ringRadiusPx = 16,
      ringSoftPx = 1,
      // Текущий масштаб активной иконки
      scale = 1.2,
      // Свести центральный glow, чтобы не «выжигал» глиф
      glow = 0.1,
      insetGlow =0.1,
      // Цвет глифа
      glyph = 'inherit',
      activeGlyphColor = 'var(--gold, #D4AF37)',


      // капсула
      capEnabled = true,
      capTint = 'var(--gold, #D4AF37)',
      capDiameterPx = null,
      capFillAlpha = .2,
      capHighlightAlpha = 0.3,
      capHighlightBias = .12,
      capBorderAlpha = 0.04,
      capGlowAlpha = 0.04,
    } = a;

    if (!isActive) return node;

    const gold = 'var(--gold, #D4AF37)';
    const fillDisk = fillEnabled ? (
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: fillRadiusPx * 2,
            height: fillRadiusPx * 2,
            // Плотная «стеклянная» заливка без яркого хотспота
            background: `
              radial-gradient(
                circle at 50% 45%,
                color-mix(in oklab, ${gold} 86%, black 14%) 0%,
                color-mix(in oklab, ${gold} 78%, black 22%) 100%
              )`,
            opacity: fillAlpha,
          }}
        />
        {strokeEnabled && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: fillRadiusPx * 2,
              height: fillRadiusPx * 2,
              boxShadow: `inset 0 0 0 ${strokeWidthPx}px rgba(212,175,55,${strokeAlpha})`,
            }}
          />
        )}
      </div>
    ) : null;



    const coloredNode =
      glyph === 'gold' || glyph === 'custom'
        ? React.cloneElement(node, {
            style: {
              ...(node.props?.style || {}),
              color: glyph === 'gold' ? 'var(--gold, #D4AF37)' : activeGlyphColor,
            },
          })
        : node;

    const ring = ringEnabled ? (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ transform: 'translateZ(0)' }}
        aria-hidden
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: ringRadiusPx * 2,
            height: ringRadiusPx * 2,
            background: `radial-gradient(circle, rgba(212,175,55,${ringAlpha}) 0%, rgba(212,175,55,0) ${ringSoftPx}px 100%)`,
          }}
        />
      </div>
    ) : null;


    // ── КРУГЛАЯ КАПСУЛА ИЗ «ЗОЛОТОГО СТЕКЛА»
    // диаметр: из пропсов или отталкиваемся от геометрии слота (chipSize * 1.55)
    const slot = Math.max(12, geometry?.chipSize ?? 25);
    const capD = Math.round(
      (typeof capDiameterPx === 'number' && capDiameterPx > 0)
        ? capDiameterPx
        : slot * 1.55
    );

    const capLayer = capEnabled ? (
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: capD,
          height: capD,
          // два радиальных: базовая «золотая» глубина + верхний блик
          background: `
            radial-gradient(65% 65% at 50% ${Math.round(capHighlightBias * 100)}%,
              rgba(255,255,255,${capHighlightAlpha}) 0%,
              rgba(255,255,255,0) 60%),
            radial-gradient(circle at 50% 50%,
              color-mix(in oklab, ${capTint} ${Math.round(capFillAlpha * 100)}%, transparent) 0%,
              color-mix(in oklab, ${capTint} 0%, transparent) 100%)
          `,
          // тонкий контур-хейрлайн + мягкое внешнее «стеклянное» сияние
          boxShadow: `
            0 0 0 var(--hairline, 0.5px) rgba(255,255,255,${capBorderAlpha}),
            0 0 14px rgba(212,175,55,${capGlowAlpha})
          `,
          // защита от смешивания с низлежащими слонами узора
          mixBlendMode: 'normal',
        }}
        aria-hidden
      />
    ) : null;


    return (
      <div
        className="relative rounded-full"
        style={{
          transform: `scale(${scale})`,
          boxShadow: `
            0 0 10px rgba(212,175,55,${glow}),
            inset 0 0 6px rgba(255,255,255,${insetGlow})
          `,
          transition: 'transform 160ms ease, box-shadow 160ms ease',
        }}
      >
        {fillDisk}
        {ring /* внешнее «кольцо»-ореол */}
        {capLayer /* новая стеклянная капсула */}
        {coloredNode}
      </div>
    );
  },
};
