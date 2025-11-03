// src/pages/HomePage.jsx
//
// HomePage — композиция лендинга + мобильная круговая навигация (FloatingChipWheel).
//
// ИДЕЯ СТРАНИЦЫ:
//  • Страница состоит из секций (Hero / About / Rating / Calendar / Gallery).
//  • На мобилке добавляем плавающую «фишку»-колесо (FloatingChipWheel) — быстрый переход по секциям.
//  • На десктопе колесо скрыто (им занимается сам компонент через sm:hidden).
//
// НАВИГАЦИОННАЯ МОДЕЛЬ:
//  • useSectionNav(ids):
//      - activeId   — текущая видимая секция (по IntersectionObserver).
//      - scrollTo() — плавно скроллит к секции.
//      - register() — привязывает DOM-ноду секции (через <SectionAnchor />).
//  • FloatingChipWheel:
//      - items       — список секций (id, label, icon).
//      - activeId    — синхронизируем с useSectionNav.
//      - onSelect    — по клику/снапу вызывает scrollTo(id).
//      - визуал/геометрия/скин вынесены в пропсы — см. блок ниже.
//
// ПРАКТИКА:
//  • Большинство визуальных значений — «на местах» (в пропсах), а не в дефолтах компонента,
//    чтобы через месяц было понятно, «на что смотреть» и что менять.
//  • КОММЕНТАРИИ НИЖЕ — не удаляй: это «шпаргалка» по пропсам.

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Макет и секции (как в текущем PROD)
import { Section } from '@/components/layout/Section';
import { ValuePropsSection } from '@/components/features/ValueProps/ValuePropsSection';
import { PlayerRatingWidget } from '@/components/features/PlayerRatingWidget/PlayerRatingWidget';
import { TournamentCalendar } from '@/components/features/TournamentCalendar/TournamentCalendar';
import { AtmosphereGallery } from '@/components/features/AtmosphereGallery/AtmosphereGallery';
import { FAQ } from '@/components/features/FAQ/FAQ';
import { HeroSection } from '@/components/features/Hero/HeroSection';
import { UserPathsSection } from '@/components/features/UserPaths/UserPathsSection';
import { GuestFormModal } from '@/components/features/RegistrationForm/GuestFormModal';

// DEV-паттерны, перенесённые в PROD
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { scrollToSection, extractSectionIdFromHash } from '@/lib/sectionNav';
import { SectionAnchor } from '@/ui/patterns/SectionAnchor';
import { useSectionNav } from '@/hooks/useSectionNav';
import { FloatingChipWheel } from '@/ui/patterns/FloatingChipWheel';

// Иконки для колесика
import { Home as HomeIcon, Info, CalendarDays, Images, Trophy } from 'lucide-react';

// Небольшая декоративная разделительная линия (как было)
function GoldLine() {
  return <div className="art-deco-divider" />;
}

/* ───────────────────────────────────────────────────────────────────
   ВИДЕО: подбор источников под десктоп / мобилу
   ─────────────────────────────────────────────────────────────────── */
const desktopVideoSources = [
  { webm: '/videos/poker_1.webm', mp4: '/videos/poker_1_compressed.mp4' },
  { webm: '/videos/poker_2.webm', mp4: '/videos/poker_2_compressed.mp4' },
  { webm: '/videos/poker_3.webm', mp4: '/videos/poker_3_compressed.mp4' },
  { webm: '/videos/poker_4.webm', mp4: '/videos/poker_4_compressed.mp4' },
  { webm: '/videos/poker_5.webm', mp4: '/videos/poker_5_compressed.mp4' },
  { webm: '/videos/poker_6.webm', mp4: '/videos/poker_6_compressed.mp4' },
];

const mobileVideoSources = [
  { webm: '/videos/poker_1_mobile.webm', mp4: '/videos/poker_1_mobile.mp4' },
  { webm: '/videos/poker_2_mobile.webm', mp4: '/videos/poker_2_mobile.mp4' },
  { webm: '/videos/poker_3_mobile.webm', mp4: '/videos/poker_3_mobile.mp4' },
  { webm: '/videos/poker_4_mobile.webm', mp4: '/videos/poker_4_mobile.mp4' },
  { webm: '/videos/poker_5_mobile.webm', mp4: '/videos/poker_5_mobile.mp4' },
  { webm: '/videos/poker_6_mobile.webm', mp4: '/videos/poker_6_mobile.mp4' },
];

export function HomePage({ onAuthModalOpen }) {
  /* ────────────────────────────────────────────────────────────────
     Локальные состояния страницы
     ──────────────────────────────────────────────────────────────── */
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isGuestModalOpen, setGuestModalOpen] = useState(false);
  const location = useLocation();

  /* ────────────────────────────────────────────────────────────────
     Medias — выбираем набор видео и автоперелистывание
     ──────────────────────────────────────────────────────────────── */
  const isMobile = useMediaQuery('(max-width: 768px)');
  const videoSources = isMobile ? mobileVideoSources : desktopVideoSources;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videoSources.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [videoSources.length]);

  /* ────────────────────────────────────────────────────────────────
     Modals
     ──────────────────────────────────────────────────────────────── */
  const openGuestModal = () => setGuestModalOpen(true);
  const closeGuestModal = () => setGuestModalOpen(false);

  /* ────────────────────────────────────────────────────────────────
     Прокрутка к блоку «Пути гостя» (по кнопке из Hero)
     ──────────────────────────────────────────────────────────────── */
  const scrollToUserPaths = () => {
    const element = document.getElementById('user-paths-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };



  /* ────────────────────────────────────────────────────────────────
       Хэш-навигация (#section-id) — мягкая поддержка закладок
     Совместимость:
       • старые ссылки вида  #about
       • новые ссылки вида   #section-about  (SectionAnchor ставит такие id)
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const raw = location.hash?.replace('#', '');
    if (!raw) return;
    const candidates = [`section-${raw}`, raw]; // сначала префиксованный, потом «голый»
    const target = candidates.map(id => document.getElementById(id)).find(Boolean);
    if (!target) return;
    // чуть откладываем, чтобы разметка точно отрендерилась
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [location]);
  /* ────────────────────────────────────────────────────────────────
     Хэш-навигация (#about / #section-about) → централизованный скролл
     ─ поддерживаем оба формата через extractSectionIdFromHash
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const hash = location?.hash;
    if (!hash) return;
    const id = extractSectionIdFromHash(hash);
    if (!id) return;
    // небольшая задержка — даём секциям отрендериться
    const t = setTimeout(() => scrollToSection(id), 80);
    return () => clearTimeout(t);
  }, [location?.hash]);






  /* ────────────────────────────────────────────────────────────────
     КОНФИГ СЕКЦИЙ для колесика (идентификаторы/лейблы/иконки)
     ──────────────────────────────────────────────────────────────── */
  const SECTIONS = [
    { id: 'hero',     label: 'Главная',  Icon: HomeIcon },
    { id: 'about',    label: 'О клубе',  Icon: Info },
    { id: 'rating',   label: 'Рейтинг',  Icon: Trophy },
    { id: 'calendar', label: 'Турниры',  Icon: CalendarDays },
    { id: 'gallery',  label: 'Галерея',  Icon: Images },
  ];

  // IDs для навигационного хука
  const ids = SECTIONS.map((s) => s.id);

  // Навигация по секциям: activeId/scrollTo/register
  const { activeId, scrollTo, register } = useSectionNav(ids);

  // Данные для колесика: { id, label, icon }
  const mobileChipItems = SECTIONS.map((s) => ({
    id: s.id,
    label: s.label,
    icon: s.Icon ? <s.Icon className="w-4 h-4" aria-hidden="true" /> : null,
  }));

  /* ────────────────────────────────────────────────────────────────
     РЕНДЕР
     ──────────────────────────────────────────────────────────────── */
  return (
    <div className="relative min-h-screen bg-[url('/textures/dark_texture.png')]">
      {/* лёгкое затемнение по краям — как было */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#1a1a1a)]" />

      <>
        <GoldLine />

        {/* Hero — привязка к навигации через SectionAnchor */}
        <SectionAnchor id="hero" register={register}>
          <HeroSection
            videoSources={videoSources}
            currentVideoIndex={currentVideoIndex}
            scrollToUserPaths={scrollToUserPaths}
          />
        </SectionAnchor>

        <GoldLine />

        <SectionAnchor id="about" register={register}>
          <Section>
            <ValuePropsSection />
          </Section>
        </SectionAnchor>

        <GoldLine />

        <SectionAnchor id="rating" register={register}>
          <Section>
            <div className="max-w-2xl mx-auto px-4">
              <PlayerRatingWidget />
            </div>
          </Section>
        </SectionAnchor>

        <GoldLine />

        {/* Блок «Пути гостя» — вне круговой навигации (как и договаривались) */}
        <div id="user-paths-section">
          <div id="userpaths">
            <UserPathsSection
              onAuthModalOpen={onAuthModalOpen}
              onGuestModalOpen={openGuestModal}
            />
          </div>
        </div>

        <GoldLine />

        <SectionAnchor id="calendar" register={register}>
          <Section>
            <div className="max-w-4xl mx-auto px-4">
              <TournamentCalendar />
            </div>
          </Section>
        </SectionAnchor>

        <GoldLine />

        <SectionAnchor id="gallery" register={register}>
          <Section>
            <AtmosphereGallery />
          </Section>
        </SectionAnchor>

        {/* FAQ пока оставляем без якоря — здесь не участвует в круговой навигации */}
        <Section>
          <div className="max-w-2xl mx-auto px-4">
            <FAQ />
          </div>
        </Section>

        <GoldLine />
      </>

      {/* ───────────────────────────────────────────────────────────────
         FLOATING CHIP WHEEL — мобильная круговая навигация

         Пояснения к пропсам:
         • items:        [{ id, label, icon }] — источники секций (см. выше).
         • activeId:     «внешняя правда», какую секцию сейчас считаем активной.
         • onSelect(id): клик/снап → скроллим к секции (scrollTo из useSectionNav).

         • dock:         угол привязки ('br'|'bl'|'tr'|'tl').
         • size:         диаметр фишки в px (геометрия ВСЕГО колеса).
         • radius:       радиус дорожки иконок (важно для совпадения с узорами скина).
         • stepDeg:      шаг между иконками (в градусах). Для пяти секций удобно 360/10*1? —
                          мы используем ровно 36°, чтобы клиньев было много, но актив попадал ровно.
         • iconSize:     размер глифа иконки.
         • chipSize:     размер «слота» иконки (от него зависит капсула активного и др. эффекты).
         • labelOffset:  сдвиг подписи (пилюли/лейбла) от геометрического центра.
         • labelClassName: стили подписи — добавляем font-ui-role, чтобы шрифт совпадал с DEV.
         • labelMenuVariant: 'panel' | 'compact' | 'accordion' — в PROD используем 'accordion'.

         • sound:        короткие «щелчки» (tick/snap) синтезом — без загрузки файлов.
         • skin:         визуальная оболочка (здесь — 'poker').
         • skinProps:    параметризация скина. Важное:
                           - palette:      'titanium' | 'glassRedIvory' | 'silver'
                           - center:       'bowl' | 'bezel' (мы берём 'bezel': диск + нижняя подложка)
                           - cupInnerR:    радиус центрального диска (px)
                           - underDisk*    параметры подложки (ширина «полки», инсет-тени, матч цвета)
                           - rimWidth:     толщина цветного обода (кольца) — «ширина секторов»
                           - gapDeg:       разделители между клиньями (градусы)
                           - blur/saturate/brighten: сила стекла под ободом
                           - activeIcon:   акцент активной иконки (кольцо/свечения/масштаб)

         • ВАЖНО: size + radius + cupInnerR + rimWidth — должны быть согласованы,
           чтобы нижний диск касался внутренней кромки клиньев БЕЗ наложения.
           Ниже — наши проверенные значения, перенесённые из DEV «как есть».
         ─────────────────────────────────────────────────────────────── */}
      <FloatingChipWheel
        /* 📦 ДАННЫЕ / API */
        items={mobileChipItems}
        activeId={activeId}
        onSelect={scrollTo}

        /* 📍 РАЗМЕЩЕНИЕ */
        dock="br" // привязка к правому нижнему углу

        /* 📐 ГЕОМЕТРИЯ / ВИЗУАЛ ОБЩИЙ (из DEV — важны для совпадения радиусов) */
        size={240}           // ⌀ фишки (px). Критично: управляет всей геометрией.
        radius={103}         // радиус дорожки иконок (px) — калиброван под скин.
        stepDeg={36}         // шаг между иконками (deg)
        iconSize={17}        // размер глифа иконки (px)
        chipSize={17}        // размер «слота» иконки (px)
        labelOffset={{ x: -12, y: -20 }} // позиция подписи (смещаем слегка вверх/влево)
        labelClassName="text-left text-m px-2 py-1 font-ui-role" // шрифт как в DEV

        /* 🔽 ВАРИАНТ МЕНЮ ПОДПИСИ */
        labelMenuVariant="accordion" // новая «пилюля-аккордеон» в центре

        /* 🔉 ОТКЛИК (синтез short tick/snap) */
        sound={{ enabled: true, snap: 0.15, tick: 0.02 }}

        /* 🎨 СКИН — poker (бесшовный узор клиньев + стекло + центр) */
        skin="poker"
        skinProps={{
          /* Палитра узора/фона */
          palette: 'silver',

          /* ⚪ Центр — «bezel»: центральный диск на нижней подложке
             (даёт красивую «полку» и тени вокруг)
          */
          center: 'bezel',
          cupInnerR: 75,               // радиус центрального диска (px)

          /* ⭕ Нижний диск-подложка
             — enabled: включение слоя
             — match: 'red'|'ivory'|'none' — подгон цвета как у клиньев (через те же tint-альфы);
                      если нужен свой цвет/градиент — используйте underDiskFill
             — extraPx: насколько нижний диск больше центрального (создает ширину «полки»)
             — brightness: равномерно осветлить/затемнить подложку
             — inset-тени: тёмная и тонкий светлый кант по внутренней кромке */

          underDiskEnabled: true,
          underDiskMatch: 'red',       // сопоставить оттенок с красным клином (через те же tint-альфы)
          underDiskExtraPx: 11,        // ширина видимой «полки» вокруг центра (px)
          underDiskBlurPx: 12,         // мягкие inset-тени
          underDiskInsetDark: 0.65,
          underDiskInsetLight: 0.24,
          underDiskBrightness: 1.2,    // подровнять яркость подложки

          /* 💡 Центральный диск — тонкий светлый кант + вариант шейдинга */
          centerInsetLight: 0.16,
          centerInvertShading: false,  // классический «свет из центра»

          /* 🌫 Drop-тени от центрального диска на нижний (создают «парение») */
          centerDropLightAlpha: 0.12,
          centerDropLightBlur: 12,

          /* 📀 Обод с клиньями + «стекло» поверх фона */
          rimWidth: 45,                // толщина обода (ширина сектора)
          gapDeg: 1,                   // тонкие разделители между клиньями
          phaseDeg: 0,                 // при необходимости тонкая подстройка совпадения
          overlapDeg: 0.0,             // можно слегка «перекрыть» клин соседним, чтобы не было щелей
          blurPx: 8,                   // сила размытия стекла
          saturate: 1.12,              // насыщенность фона под стеклом
          brighten: 1.04,              // яркость фона под стеклом
          showGaps: true,              // рисовать тонкие разделители поверх узора
          gapAlpha: 0.28,              // прозрачность разделителей

          /* Акцент активной иконки (кольцо/свечения/масштаб) */
          activeIcon: {
            ringEnabled: true,
            ringAlpha: 1.02,
            ringRadiusPx: 16,
            glow: 0.33,
            insetGlow: 0.12,
          },
          /* ✨ Активная иконка — настройки в pokerSkin.jsx (activeIcon):
             по умолчанию: золотая мягкая подложка, лёгкий glow и scale.
             — Переопределять можно так:
             activeIcon: {
               ringEnabled: true,
               ringAlpha: 0.18,
               ringRadiusPx: 20,
               ringSoftPx: 10,
               scale: 1.2,
               glow: 0.30,
               insetGlow: 0.12,
               glyph: 'inherit', // 'inherit' | 'gold' | 'custom'
               activeGlyphColor: 'var(--gold, #D4AF37)',
             }
          */

        }}

        /* ─────────────── НЕИСПОЛЬЗУЕМЫЕ ЗДЕСЬ / ДЕФОЛТНЫЕ (для шпаргалки) ───────────────
           — Включать по необходимости: раскомментируйте и поменяйте значение.
           skinProps:
             // visualWedgeDeg={null}   // «частота» декоративных клиньев
             // centerDropDarkAlpha={0.28}
             // centerDropDarkBlur={16}
             // underDiskFill={'#RRGGBB' | 'radial-gradient(...)'}
        */
      />

      {/* Модалка гостевой формы */}
      <GuestFormModal isOpen={isGuestModalOpen} onClose={closeGuestModal} />
    </div>
  );
}
