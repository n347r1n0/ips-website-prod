// frontend/src/ui/patterns/FloatingChipWheel.jsx

import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { pokerSkin } from '@/ui/skins/wheels/pokerSkin';
import { AccordionPill } from '@/ui/patterns/AccordionPill';

/**
 * FloatingChipWheel — круговая навигация с дуговым свайпом и снапом.
 *
 * ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ:
 *  • Во время жеста «правда» = snapCandidateRef (то, что на экране).
 *  • Отпустили палец — коммитим committedStepRef и колесо доснапивается.
 *  • Внешняя синхронизация игнорируется, пока идёт взаимодействие/анимация/settle.
 *
 * Угол иконки: angle = center + (logicalStep - stepF) * stepDeg.
 */

export function FloatingChipWheel({
  // ───────────────────────────────────────────────────────────────
  // 📦 ДАННЫЕ / API
  items = [],           // массив { id, label, icon | Icon }
  activeId,             // id активной секции (внешняя правда страницы)
  onSelect,             // (id) => void — сообщаем наружу выбор шага

  // ───────────────────────────────────────────────────────────────
  // 📍 РАЗМЕЩЕНИЕ
  dock = 'br',          // 'br' | 'bl' | 'tr' | 'tl'
  offset = { x: -36, y: -15 }, // смещение фишки от угла (px)
  hideOnDesktop = true, // скрывать на ≥sm
  className = '',       // доп. классы контейнера

  // ───────────────────────────────────────────────────────────────
  // 📐 ГЕОМЕТРИЯ / ВИЗУАЛ
  size = 230,           // ⌀ фишки (px)
  radius = 99,          // радиус дорожки иконок (px)
  centerAngle,          // угол «центра» (deg); если не задан — из dock
  stepDeg,              // шаг между иконками (deg); иначе 360/N
  iconSize = 17,        // размер глифа иконки (px)
  chipSize = 25,        // размер слота иконки (px)
  labelOffset = { x: -12, y: -18 }, // смещение подписи от гео-центра (px)
  labelClassName = '',  // доп. классы подписи

  // ───────────────────────────────────────────────────────────────
  // ✋ ЖЕСТЫ / ПОВЕДЕНИЕ
  enableSwipe = true,   // включить свайп по дуге
  deadzonePx = 6,       // порог старта драга (deg)
  snapDurationMs = 160, // длительность «доводки» (ms)
  showDragIndicator = true, // дуга при перетягивании (для простых скинов)

  // ───────────────────────────────────────────────────────────────
  // 🔔 ОТКЛИК
  haptics = 'auto',         // true | false | 'auto' — 'auto' включает vibrate(8) при наличии API
  sound = false,            // false | { src, volume?: number } — короткий щелчок при снапе

  soundMaster = 0.5,        // 0..1 — общий уровень звука (доп. аттенюатор, особенно полезен на iOS)

  // ───────────────────────────────────────────────────────────────
  // 🔘 КЛИКАБЕЛЬНАЯ ПОДПИСЬ
  enableLabelMenu = true,   // включить меню выбора секций по клику на лейбл
  menuMaxHeight = '38vh',   // максимальная высота меню
  onMenuOpen,               // () => void — колбек при открытии меню
  onMenuClose,              // () => void — колбек при закрытии меню




  // ───────────────────────────────────────────────────────────────
  // ⚙️ ВАРИАНТ МЕНЮ ПОДПИСИ
  labelMenuVariant = 'panel',   // 'panel' | 'compact' | 'accordion'
  compactMaxItems = 6,          // максимум пунктов в компакт-списке (оставь 6; можно Infinity показать все)
  compactOrder = 'clockwise',   // 'clockwise' | 'original' — порядок пунктов
  compactDirection = 'auto',    // 'up' | 'down' | 'auto'
  // compactAlign = 'center',      // 'center' (зарезервировано; на будущее: 'start'|'end')
  compactGutter = 8,            // отступ от пилюли до компакт-списка (px)
  compactItemHeight = 40,       // высота строки в компакт-списке (px) — только для расчётов


  // ───────────────────────────────────────────────────────────────
  // 🎨 СКИН
  skin = 'poker',       // 'glass' | 'poker'
  skinProps = {},       // параметры скина (цвета/ширины/центр/акцент активной иконки и пр.)
}) {
  // ───────────────────────────────────────────────────────────────
  // Подготовка данных
  const clean = useMemo(() => items.filter(Boolean), [items]);
  const N = clean.length;

  const autoStep = 360 / N;
  const step = typeof stepDeg === 'number' ? stepDeg : autoStep;

  const defaultCenter = { br: 215, bl: 325, tr: 145, tl: 35 }[dock] ?? 215;
  const center = typeof centerAngle === 'number' ? centerAngle : defaultCenter;

  const anchor = {
    br: { corner: 'bottom-0 right-0', tx: +1, ty: +1 },
    bl: { corner: 'bottom-0 left-0',  tx: -1, ty: +1 },
    tr: { corner: 'top-0 right-0',    tx: +1, ty: -1 },
    tl: { corner: 'top-0 left-0',     tx: -1, ty: -1 },
  }[dock];

  const translate = `translate(calc(${anchor.tx * 50}% + ${anchor.tx * (offset?.x ?? 0)}px),
                                calc(${anchor.ty * 50}% + ${anchor.ty * (offset?.y ?? 0)}px))`;

  // ───────────────────────────────────────────────────────────────
  // Источник правды — stepF (дробный шаг)
  const [stepFState, setStepFState] = useState(0);
  const stepF = useRef(0);
  const setStepF = (v) => { stepF.current = v; setStepFState(v); };

  const snapCandidateRef = useRef(0);    // ближайший целый «под пальцем»
  const committedStepRef = useRef(null); // зафиксированный шаг на время снапа

  // Ввод/анимация
  const rootRef = useRef(null);
  const draggingRef = useRef(false);
  const startedRef = useRef(false);
  const startAngleRef = useRef(0);
  const startStepRef = useRef(0);

  const rafRef = useRef(null);
  const [animating, setAnimating] = useState(false);

  // Web Audio (синтез)
  const audioCtxRef = useRef(null);     // AudioContext
  const masterGainRef = useRef(null);   // общий уровень
  const tickGainRef = useRef(null);     // уровень "tick"
  const snapGainRef = useRef(null);     // уровень "snap"

  // Тики при проходе целых шагов
  const lastIntRef = useRef(null);      // последний целочисленный шаг
  const lastTickTimeRef = useRef(0);
  const TICK_COOLDOWN_MS = 60;          // анти-спам для тиков



  const hasUserInteractedRef = useRef(false); // был ли реальный жест пользователя
  const audioArmedRef = useRef(false);       // AudioContext создан/разбужен в рамках жеста


  // Отклик: звук + троттлинг

  const lastSnapTickRef = useRef(0);        // timestamp последнего отклика
  const SNAP_FEEDBACK_MIN_MS = 120;         // троттлинг отклика


  // Лок внешней синхры на ожидаемый id + settle-пауза
  const lockTargetIdRef = useRef(null);
  const lockTimerRef = useRef(null);
  const interactionLockRef = useRef(false);
  const interactionTimerRef = useRef(null);
  const settleMs = 250;

  // Доступ к unlockBody вне эффекта жестов
  const unlockBodyRef = useRef(() => {});

  // Текущий индекс иконки (нужен до эффектов меню)
  const currentIndex = useMemo(() => {
    const refStep =
      (committedStepRef.current !== null)
        ? committedStepRef.current
        : (draggingRef.current ? snapCandidateRef.current : Math.round(stepF.current));
    return ((refStep % N) + N) % N;
  }, [stepFState, N]);



  // Состояние меню
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const labelRef = useRef(null);

  // Открыта ли аккордеон-пилюля — чтобы блокировать жесты колеса
  const [pillOpen, setPillOpen] = useState(false);

  // Максимальная ширина ЗАКРЫТОЙ пилюли (px), чтобы смещать якорь на +closedMax/2
  const [pillClosedMaxPx, setPillClosedMaxPx] = useState(null);




  // высота пилюли — чтобы список «прилипал» точно к ней
  const [labelH, setLabelH] = useState(0);

  useLayoutEffect(() => {
    if (labelRef.current) {
      setLabelH(labelRef.current.offsetHeight || 0);
    }
  }, [isMenuOpen, labelMenuVariant, labelClassName, labelOffset, currentIndex]);






  const menuId = `floating-wheel-menu-${Math.random().toString(36).substr(2, 9)}`;

  const pickStep = (s) => Math.round(s);


  // Платформенная коррекция (iOS звучит громче — слегка приглушим)
  const isIOS = typeof navigator !== 'undefined'
    ? /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    : false;

  // Расчёт уровней с учётом master и платформы
  const getLevels = () => {
    const master = typeof soundMaster === 'number' ? Math.max(0, Math.min(1, soundMaster)) : 0.5;
    const platform = isIOS ? 0.6 : 1.0; // мягкий -4 dB примерно для iOS
    const baseSnap = (sound && typeof sound.snap === 'number') ? sound.snap : 0.6;
    const baseTick = (sound && typeof sound.tick === 'number') ? sound.tick : 0.25;
    return {
      master: master * platform,
      snap: baseSnap * master * platform,
      tick: baseTick * master * platform,
    };
  };


  // Инициализация AudioContext и гейнов
  const ensureAudio = () => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();

    const master = ctx.createGain();


    const L = getLevels();
    master.gain.value = L.master;


    master.connect(ctx.destination);

    const tickG = ctx.createGain();

    tickG.gain.value = getLevels().tick;


    tickG.connect(master);

    const snapG = ctx.createGain();

    snapG.gain.value = getLevels().snap;


    snapG.connect(master);

    audioCtxRef.current = ctx;
    masterGainRef.current = master;
    tickGainRef.current = tickG;
    snapGainRef.current = snapG;
    return ctx;
  };

  // Небольшой клик синтезом: короткий высокочастотный импульс

  const synthClick = (type = 'snap') => {
    const ctx = audioCtxRef.current; // не создаём контекст здесь
    if (!ctx) return;



    // выбираем параметры
    const isSnap = type === 'snap';
    const freq   = isSnap ? 1900 : 2400; // Гц
    const durMs  = isSnap ? 28   : 16;   // длительность
    const gNode  = isSnap ? snapGainRef.current : tickGainRef.current;


    if (!gNode) return;
    // подхватываем актуальные уровни на каждый щелчок
    const L = getLevels();
    gNode.gain.value = (type === 'snap') ? L.snap : L.tick;


    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const env = ctx.createGain();
    env.gain.setValueAtTime(1, ctx.currentTime);
    // быстрый экспоненциальный спад
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durMs / 1000);

    osc.connect(env).connect(gNode);
    osc.start();
    osc.stop(ctx.currentTime + durMs / 1000);
  };




  // Мягкий отклик (вибро + опциональный звук) с троттлингом


  const playSnapFeedback = () => {
    const now = performance.now();
    // троттлинг только для звука (snap можно без троттлинга, но оставим общий)
    if (now - (lastSnapTickRef.current || 0) < SNAP_FEEDBACK_MIN_MS) return;
    lastSnapTickRef.current = now;

    // Haptics — только после реального взаимодействия, иначе Intervention
    const wantHaptics = hasUserInteractedRef.current && (haptics === true || (haptics === 'auto' && 'vibrate' in navigator));
    if (wantHaptics) { try { navigator.vibrate?.(8); } catch {/* ignore haptics errors */} }

    // Звук "snap" — синтезом, без файлов
    synthClick('snap');


  };




  // Подхватываем новые уровни, если изменились пропсы sound/soundMaster
  // ВАЖНО: здесь НЕЛЬЗЯ создавать AudioContext, только обновлять, если он уже есть.
  useEffect(() => {
    const ctx = audioCtxRef.current; // ← не вызываем ensureAudio()
    if (!ctx) return;
    const L = getLevels();
    if (masterGainRef.current) masterGainRef.current.gain.value = L.master;
    if (tickGainRef.current)   tickGainRef.current.gain.value   = L.tick;
    if (snapGainRef.current)   snapGainRef.current.gain.value   = L.snap;
  }, [sound, soundMaster]);




  // ───────────────────────────────────────────────────────────────
  // Анимация
  const animateStepTo = (targetStep, durMs, onDone) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const start = stepF.current;
    const delta = targetStep - start;

    if (Math.abs(delta) < 1e-3 || durMs <= 0) {
      setStepF(targetStep);
      onDone?.();
      return;
    }

    setAnimating(true);
    const t0 = performance.now();

    const tick = (t) => {
      const p = Math.min(1, (t - t0) / durMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setStepF(start + delta * eased);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setStepF(targetStep);
        setAnimating(false);
        onDone?.();
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const snapTo = (logicalStep) => {
    committedStepRef.current = logicalStep;

    const id = clean[((logicalStep % N) + N) % N]?.id || null;
    lockTargetIdRef.current = id;
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      lockTargetIdRef.current = null;
      lockTimerRef.current = null;
    }, 1200);

    interactionLockRef.current = true;
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);

    // Мягкий щелчок-снап
    playSnapFeedback();


    if (id && id !== activeId) onSelect?.(id);

    animateStepTo(logicalStep, snapDurationMs, () => {
      interactionTimerRef.current = setTimeout(() => {
        interactionLockRef.current = false;
        committedStepRef.current = null;
        interactionTimerRef.current = null;
      }, settleMs);
    });
  };

  // ───────────────────────────────────────────────────────────────
  // Меню выбора секций

  const openMenu = () => {
    if (!enableLabelMenu) return;
    if (draggingRef.current || startedRef.current) {
      draggingRef.current = false;
      startedRef.current = false;
      unlockBodyRef.current?.();
    }
    setIsMenuOpen(true);
    onMenuOpen?.();
  };

  const closeMenu = () => {
    if (!isMenuOpen) return;
    setIsMenuOpen(false);
    onMenuClose?.();
  };

  const handleLabelClick = (e) => {
    if (!enableLabelMenu || labelMenuVariant === 'accordion' || animating || draggingRef.current) return;
    e.stopPropagation();
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleMenuItemClick = (targetIdx) => {
    if (!isMenuOpen || animating) return;
    closeMenu();

    // Найти ближайший логический шаг для данного индекса
    const s = stepF.current;
    let best = targetIdx;
    let bestDist = Infinity;
    for (let k = -1; k <= 1; k++) {
      const cand = targetIdx + k * N;
      const dist = Math.abs(cand - s);
      if (dist < bestDist) { bestDist = dist; best = cand; }
    }

    snapTo(best);
  };

  // ───────────────────────────────────────────────────────────────
  // Жесты
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.style.touchAction = 'none';
    return () => { root.style.touchAction = ''; };
  }, []);

  useEffect(() => {
    if (!enableSwipe) return;
    const root = rootRef.current;
    if (!root) return;

    let prevBodyTA = '';
    let prevOver = '';
    const lockBody = () => {
      prevBodyTA = document.body.style.touchAction || '';
      prevOver = document.body.style.overscrollBehaviorY || '';
      document.body.style.touchAction = 'none';
      document.body.style.overscrollBehaviorY = 'none';
    };
    const unlockBody = () => {
      document.body.style.touchAction = prevBodyTA;
      document.body.style.overscrollBehaviorY = prevOver;
    };

    // прокидываем ссылку наружу
    unlockBodyRef.current = unlockBody;



    const onDown = (e) => {
      if (animating || isMenuOpen || (labelMenuVariant === 'accordion' && pillOpen)) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);


      root.setPointerCapture?.(e.pointerId);
      draggingRef.current = true;
      startedRef.current = false;

      const rect = root.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      startAngleRef.current = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
      startStepRef.current = stepF.current;

      snapCandidateRef.current = pickStep(stepF.current);

      hasUserInteractedRef.current = true;
      lastIntRef.current = Math.floor(stepF.current);


      hasUserInteractedRef.current = true;



      // Разбудим Web Audio строго в рамках первого жеста пользователя
      if (!audioArmedRef.current) {
        try {
          const ctx = ensureAudio();
          if (ctx && ctx.state !== 'running') {
            ctx.resume?.().catch(() => {});
          }
          audioArmedRef.current = true;
        } catch {/* ignore audio context errors */}
      }



    };

    const onMove = (e) => {
      if (!draggingRef.current || animating || isMenuOpen || (labelMenuVariant === 'accordion' && pillOpen)) return;

      const rect = root.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angNow = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;

      let deltaDeg = angNow - startAngleRef.current;
      if (deltaDeg > 180) deltaDeg -= 360;
      if (deltaDeg < -180) deltaDeg += 360;

      // по часовой — вперёд по ленте
      deltaDeg = -deltaDeg;

      if (!startedRef.current) {
        if (Math.abs(deltaDeg) < deadzonePx) return;
        startedRef.current = true;
        lockBody();
      }

      e.preventDefault?.();

      const deltaStep = deltaDeg / step;
      const nextStepF = startStepRef.current + deltaStep;

      // "tick": когда пересекаем следующий целый шаг
      if (startedRef.current) {
        const nextInt = Math.floor(nextStepF);
        if (lastIntRef.current === null) lastIntRef.current = Math.floor(startStepRef.current);
        if (nextInt !== lastIntRef.current) {
          const tNow = performance.now();
          if (tNow - (lastTickTimeRef.current || 0) > TICK_COOLDOWN_MS) {
            synthClick('tick');

            lastTickTimeRef.current = tNow;
          }
          lastIntRef.current = nextInt;
        }
      }





      setStepF(nextStepF);
      snapCandidateRef.current = pickStep(nextStepF);
    };

    const onEnd = () => {
      if (!draggingRef.current || isMenuOpen) return;
      draggingRef.current = false;

      if (startedRef.current) {
        const targetStep = snapCandidateRef.current;
        snapTo(targetStep);
      }

      startedRef.current = false;
      unlockBody();
    };

    root.addEventListener('pointerdown', onDown, { passive: true });
    root.addEventListener('pointermove', onMove, { passive: false });
    root.addEventListener('pointerup', onEnd, { passive: false });
    root.addEventListener('pointercancel', onEnd, { passive: false });
    root.addEventListener('pointerleave', onEnd, { passive: false });

    return () => {
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onEnd);
      root.removeEventListener('pointercancel', onEnd);
      root.removeEventListener('pointerleave', onEnd);
      // drop external unlock reference
      unlockBodyRef.current = () => {};
    };
  }, [enableSwipe, deadzonePx, snapDurationMs, step, N, clean, activeId, onSelect, animating, isMenuOpen, pillOpen, labelMenuVariant]);


  // ───────────────────────────────────────────────────────────────
  // Обработка меню
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
      }
    };

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          labelRef.current && !labelRef.current.contains(e.target)) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handleClickOutside, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleClickOutside, true);

    };
  }, [isMenuOpen]);

  // Автоскролл к активному элементу при открытии меню
  useEffect(() => {
    if (!isMenuOpen || !menuRef.current) return;

    const activeElement = menuRef.current.querySelector('[data-active="true"]');
    if (activeElement) {
      activeElement.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [isMenuOpen, currentIndex]);

  // ───────────────────────────────────────────────────────────────
  // Внешняя синхронизация
  useEffect(() => {
    if (interactionLockRef.current || animating) return;

    if (lockTargetIdRef.current) {
      if (activeId === lockTargetIdRef.current) {
        lockTargetIdRef.current = null;
        if (lockTimerRef.current) { clearTimeout(lockTimerRef.current); lockTimerRef.current = null; }
      } else {
        return;
      }
    }

    const targetIdx = clean.findIndex(it => it.id === activeId);
    if (targetIdx < 0) return;

    const s = stepF.current;
    let best = targetIdx;
    let bestDist = Infinity;
    for (let k = -1; k <= 1; k++) {
      const cand = targetIdx + k * N;
      const dist = Math.abs(cand - s);
      if (dist < bestDist) { bestDist = dist; best = cand; }
    }

    if (bestDist > 1e-3) {
      animateStepTo(best, snapDurationMs);
    }
  }, [activeId, clean, N, snapDurationMs, animating]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
  }, []);

  // ───────────────────────────────────────────────────────────────
  // Окно иконок
  const visibleIcons = useMemo(() => {
    const base = Math.floor(stepF.current);
    const arr = [];
    for (let offset = -2; offset <= 2; offset++) {
      const logicalStep = base + offset;
      const idx = ((logicalStep % N) + N) % N;
      const angle = center + (logicalStep - stepF.current) * step;
      arr.push({ key: `${clean[idx].id}:${logicalStep}`, idx, angle, logicalStep });
    }
    return arr;
  }, [stepFState, step, center, N, clean]);



  // Геометрия для скина
  const base = Math.floor(stepF.current);
  const frac = stepF.current - base;
  const geometry = {
    size,
    radius,
    chipSize, // ← пробросим в скин, чтобы капсула знала диаметр слота
    center,
    stepDeg: step,
    stepF: stepF.current,
    base,
    frac,
    currentIndex,
    items: clean,
  };

  const skinImpl =
    skin === 'poker'
      ? pokerSkin
      : {
          beforeIcons: () => null,
          afterIcons: () => null,
          CenterLabelWrap: (_g, _p, children) => (
            <div className="bg-white/10 border border-white/15 rounded-full">{children}</div>
          ),
          decorateIcon: (node/*, ctx*/) => node,
        };




  // Компактный порядок пунктов: начиная со следующего по часовой от активного
  const compactItems = useMemo(() => {
    if (!clean.length) return [];
    const total = clean.length;
    const start = (currentIndex + 1 + total) % total;

    let ordered;
    if (compactOrder === 'clockwise') {
      ordered = Array.from({ length: total - 1 }, (_, i) => clean[(start + i) % total]);
    } else {
      // 'original' — исходный порядок без активного
      ordered = clean.filter((_, idx) => idx !== currentIndex);
    }

    if (Number.isFinite(compactMaxItems)) {
      return ordered.slice(0, compactMaxItems);
    }
    return ordered;
  }, [clean, currentIndex, compactOrder, compactMaxItems]);



  // База: центр колеса + labelOffset (как у подписи)
  const labelBaseTranslate =
    `translate(-50%, -50%) translate(${labelOffset.x || 0}px, ${labelOffset.y || 0}px)`;

  // Направление открытия для compact
  const compactDir = useMemo(() => {
    if (compactDirection === 'auto') {
      // если колесо докнуто снизу — открываем вверх, сверху — вниз
      return anchor.ty === +1 ? 'up' : 'down';
    }
    return compactDirection;
  }, [compactDirection, anchor]);

  // Компакт: от пилюли вверх/вниз на compactGutter
  const compactTranslate =
  `${labelBaseTranslate} translateY(${compactDir === 'up' ? -compactGutter : compactGutter}px)`;

  // отдельный трансформ для аккордеона — отталкиваемся от реального края пилюли
  const accordionTranslate =
    `${labelBaseTranslate} translateY(${compactDir === 'up' ? -(labelH / 2 + compactGutter) : (labelH / 2 + compactGutter)}px)`;



  // ── параметры аккордеона (используем тот же набор пунктов, что и compact)
  const accordionItems = compactItems;
  const accordionRows = Number.isFinite(compactMaxItems)
    ? Math.min(accordionItems.length, compactMaxItems)
    : accordionItems.length;
  const accordionListMaxH = accordionRows * (compactItemHeight || 40);



  const visibilityClass = hideOnDesktop ? 'sm:hidden' : '';


  const renderIcon = (it) => {
    if (it.icon) {
      return React.cloneElement(it.icon, {
        style: { width: iconSize, height: iconSize, ...(it.icon.props?.style || {}) },
        'aria-hidden': true,
      });
    }
    if (it.Icon) return <it.Icon style={{ width: iconSize, height: iconSize }} aria-hidden="true" />;
    return null;
  };

  // Early return after all hooks
  if (N === 0) return null;

  return (
    <div
      ref={rootRef}
      className={twMerge('fixed z-50 select-none pointer-events-auto', visibilityClass, anchor.corner, className)}
      style={{ width: size, height: size, transform: translate }}
      aria-hidden={false}
    >
      <div
        className={twMerge(
          'relative rounded-full',
          'bg-[--bg-1]/80 backdrop-blur-[var(--glass-blur)]',
          'border border-[--glass-border]',
          'shadow-[var(--shadow-m)]'
        )}
        style={{ width: size, height: size, overflow: 'visible' }}
      >

        {/* skin: фон/обод/клинья до иконок */}
        {skinImpl.beforeIcons?.(geometry, skinProps)}

        {/* Подпись — через скин (он обрамит центром) */}
        {/* Центр: либо старая кнопка, либо новая «пилюля-аккордеон» */}
        {labelMenuVariant === 'accordion' ? (
          <div
            className="absolute left-1/2 top-1/2 z-[70]"
            style={{
              // Сдвигаем вправо на половину максимальной ширины закрытой пилюли,
              // чтобы её ПРАВОЕ ребро «упиралось» в прежнюю точку центра.
              // Минус 5px — компенсируем визуальный бордер стеклянной капсулы.
              // ⚠️ Не удаляйте «−5»: это осознанная правка под текущие токены.
              transform: `translate(-50%, -50%) translate(${(labelOffset.x || 0) + (pillClosedMaxPx ? (pillClosedMaxPx / 2 - 5) : 0)}px, ${labelOffset.y || 0}px)`,
              pointerEvents: 'auto',
            }}
          >
            <AccordionPill
              key={`pill-${currentIndex}`}            // пересоздаём при смене активной секции
              items={clean.map(i => i.label)}
              initialIndex={currentIndex}
              icons={clean.map(i => i.icon ?? (i.Icon ? <i.Icon style={{ width: iconSize, height: iconSize }} aria-hidden="true" /> : null))}
              className=""
              onSelect={(idx) => {
                // та же логика, что была в handleMenuItemClick
                const s = stepF.current;
                let best = idx;
                let bestDist = Infinity;
                for (let k = -1; k <= 1; k++) {
                  const cand = idx + k * N;
                  const dist = Math.abs(cand - s);
                  if (dist < bestDist) { bestDist = dist; best = cand; }
                }
                snapTo(best);
              }}
              onOpenChange={setPillOpen}
              onMeasureClosedMax={(px) => {
                // Дедупликация на всякий случай — чтобы не гонять setState на то же значение
                setPillClosedMaxPx(prev => (prev === px ? prev : px));
              }}
            />
          </div>
        ) : (
          /* старый блок с кнопкой-лейблом и меню (panel/compact) оставляем без изменений */
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translate(-50%, -50%) translate(${labelOffset.x || 0}px, ${labelOffset.y || 0}px)`,
              pointerEvents: enableLabelMenu ? 'auto' : 'none',
            }}
            ref={menuRef}
          >
            {skinImpl.CenterLabelWrap
              ? skinImpl.CenterLabelWrap(
                  geometry,
                  skinProps,
                  enableLabelMenu ? (
                    <button
                      ref={labelRef}
                      type="button"
                      onClick={handleLabelClick}
                      className={twMerge(
                        'inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[--fg-strong]',
                        'cursor-pointer transition-colors',
                        'hover:bg-white/10 focus:outline-none focus:[box-shadow:var(--ring)]',
                        labelClassName
                      )}
                      aria-label={`Current section: ${clean[currentIndex]?.label}. Click to open section menu`}
                      aria-expanded={isMenuOpen}
                      aria-haspopup="menu"
                      aria-controls={menuId}
                    >
                      <span className="truncate">{clean[currentIndex]?.label}</span>
                    </button>
                  ) : (
                    <div className={twMerge('text-center px-4 py-2 rounded-full text-[--fg-strong]', labelClassName)}>
                      {clean[currentIndex]?.label}
                    </div>
                  )
                )
              : null}

            {/* panel / compact — остаются как были ниже */}
          </div>
        )}


        {/* Меню выбора секций: panel | compact (accordion уже выше) */}
        {enableLabelMenu && isMenuOpen && labelMenuVariant !== 'accordion' && (
          (() => {
            if (labelMenuVariant === 'panel') {
              return (
                <div
                  ref={labelMenuVariant !== 'accordion' ? menuRef : null}
                  id={menuId}
                  className={twMerge(
                    'absolute left-1/2 top-1/2 z-[60] w-56 pointer-events-auto font-ui-role',
                    'rounded-xl',
                    'bg-[--glass-bg] border border-[--glass-border]',
                    'backdrop-blur-[var(--glass-blur)] shadow-[var(--shadow-s)]',
                    'transition-opacity transition-transform duration-120 ease-out',
                    'opacity-100 scale-100',
                    'motion-reduce:transition-none'
                  )}
                  style={{
                    // якорим панель к нижнему краю пилюли (или верхнему, если откроем вниз)
                    transform: `${labelBaseTranslate} translateY(${-(labelH / 2 + 10)}px)`,
                    maxHeight: menuMaxHeight,
                  }}
                  role="menu"
                  aria-label="Section selection menu"
                >
                  <div className="py-1 max-h-full overflow-y-auto">
                    {clean.map((item, idx) => {
                      const isActive = idx === currentIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleMenuItemClick(idx)}
                          data-active={isActive}
                          className={twMerge(
                            'w-full flex items-center gap-2 px-3 py-2 text-left',
                            'hover:bg-white/8 focus:bg-white/8 focus:outline-none focus:[box-shadow:var(--ring)]',
                            'transition-colors duration-75',
                            isActive ? 'bg-white/10 text-[--fg-strong] border-l border-[--gold]' : 'text-[--fg]'
                          )}
                          role="menuitem"
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <div className="w-4 h-4 flex-shrink-0 grid place-items-center">
                            {renderIcon(item)}
                          </div>
                          <span className="flex-1 truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (labelMenuVariant === 'compact') {
              return (
                <div
                  ref={labelMenuVariant !== 'accordion' ? menuRef : null}
                  id={menuId}
                  className={twMerge(
                    'absolute left-1/2 top-1/2 z-[60] pointer-events-auto font-ui-role',
                    'rounded-xl',
                    'bg-[--glass-bg] border border-[--glass-border]',
                    'backdrop-blur-[var(--glass-blur)] shadow-[var(--shadow-s)]',
                    'px-2 py-2',
                    'transition-opacity transition-transform duration-150 ease-out',
                    'opacity-100 scale-100',
                    'motion-reduce:transition-none'
                  )}
                  style={{ transform: compactTranslate }}
                  role="menu"
                  aria-label="Section selection menu (compact)"
                >
                  <div className="flex flex-col">
                    {compactItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const idx = clean.findIndex(i => i.id === item.id);
                          handleMenuItemClick(idx);
                        }}
                        className={twMerge(
                          'flex items-center gap-2 px-3 py-1.5 rounded-md text-left',
                          'hover:bg-white/8 focus:bg-white/8 focus:outline-none focus:[box-shadow:var(--ring)]',
                          'transition-colors duration-75 text-[--fg]'
                        )}
                        role="menuitem"
                      >
                        <div className="w-4 h-4 flex-shrink-0 grid place-items-center">
                          {renderIcon(item)}
                        </div>
                        <span className="whitespace-nowrap">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            // ───────── ACCORDION ─────────
            return (
              <div
                ref={menuRef}
                id={menuId}
                className="absolute left-1/2 top-1/2 z-[60] pointer-events-auto"
                style={{ transform: accordionTranslate }}
                role="menu"
                aria-label="Section selection menu (accordion)"
              >
                <div
                  className={twMerge(
                    'flex flex-col rounded-xl',
                    'bg-[--glass-bg] border border-[--glass-border]',
                    'backdrop-blur-[var(--glass-blur)] shadow-[var(--shadow-s)]',
                    'overflow-y-auto'
                  )}
                  style={{
                    maxHeight: accordionListMaxH,
                    minWidth: 'max(148px, fit-content)',
                  }}
                >
                  {accordionItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const idx = clean.findIndex(i => i.id === item.id);
                        handleMenuItemClick(idx);
                      }}
                      className={twMerge(
                        'flex items-center gap-2 px-3 text-left',
                        'hover:bg-white/8 focus:bg-white/8 focus:outline-none focus:[box-shadow:var(--ring)]',
                        'transition-colors duration-75 text-[--fg]'
                      )}
                      role="menuitem"
                      style={{ height: compactItemHeight }}
                    >
                      <div className="w-4 h-4 flex-shrink-0 grid place-items-center">
                        {renderIcon(item)}
                      </div>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()
        )}


        {/* Иконки — бесшовная лента c декорацией скина */}
        {visibleIcons.map(({ key, idx, angle, logicalStep }) => {
          const isActive = idx === currentIndex;

          const iconNode = (
            <div
              className={twMerge(
                'w-full h-full grid place-items-center rounded-full transition-transform',
                isActive ? 'scale-[1.06]' : ''
              )}
            >
              {renderIcon(clean[idx])}
            </div>
          );

          return (
            <button
              key={key}
              type="button"
              onClick={() => { if (!animating && !draggingRef.current) snapTo(logicalStep); }}
              className={twMerge(
                'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                'rounded-full text-[--fg]',
                isActive ? 'shadow-[var(--shadow-s)]' : ''
              )}
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`,
                width: chipSize,
                height: chipSize,
                pointerEvents: 'auto',
                willChange: 'transform',
              }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={clean[idx].label}
              title={clean[idx].label}
            >
              {skinImpl.decorateIcon
                ? skinImpl.decorateIcon(iconNode, { isActive, geometry, skinProps })
                : iconNode}
            </button>
          );
        })}

        {/* skin: поверх иконок */}
        {skinImpl.afterIcons?.(geometry, skinProps)}

        {/* Индикатор при активном драге (в poker-скине не нужен) */}
        {showDragIndicator && draggingRef.current && startedRef.current && skin !== 'poker' && (
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from ${center - 45}deg,
                transparent,
                rgba(212,175,55,0.12) ${center - 20}deg,
                rgba(212,175,55,0.22) ${center}deg,
                rgba(212,175,55,0.12) ${center + 20}deg,
                transparent)`
            }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}

export default FloatingChipWheel;
