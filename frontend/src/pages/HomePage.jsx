// frontend/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Section } from '@/components/layout/Section';
import { ValuePropsSection } from '@/components/features/ValueProps/ValuePropsSection';
import { PlayerRatingWidget } from '@/components/features/PlayerRatingWidget/PlayerRatingWidget';
import { TournamentCalendar } from '@/components/features/TournamentCalendar/TournamentCalendar';
import { AtmosphereGallery } from '@/components/features/AtmosphereGallery/AtmosphereGallery';
import { FAQ } from '@/components/features/FAQ/FAQ';
import { HeroSection } from '@/components/features/Hero/HeroSection';
import { UserPathsSection } from '@/components/features/UserPaths/UserPathsSection';
import { GuestFormModal } from '@/components/features/RegistrationForm/GuestFormModal';
import { useMediaQuery } from '@/hooks/useMediaQuery'; // 👈 1. ИМПОРТИРУЕМ НАШ ХУК

// 👇 2. СОЗДАЕМ ДВА НАБОРА ИСТОЧНИКОВ 👇
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


function GoldLine() {
  return <div className="art-deco-divider" />;
}

export function HomePage({ onAuthModalOpen }) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isGuestModalOpen, setGuestModalOpen] = useState(false);

  // 👇 3. ОПРЕДЕЛЯЕМ, МОБИЛЬНОЕ ЛИ УСТРОЙСТВО, И ВЫБИРАЕМ ВИДЕО 👇
  const isMobile = useMediaQuery('(max-width: 768px)');
  const videoSources = isMobile ? mobileVideoSources : desktopVideoSources;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videoSources.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [videoSources.length]); // Добавляем зависимость, чтобы интервал сбросился, если кол-во видео изменится


  const openGuestModal = () => setGuestModalOpen(true);
  const closeGuestModal = () => setGuestModalOpen(false);

  const scrollToUserPaths = () => {
    const element = document.getElementById('user-paths-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const location = useLocation();

  // Handle hash-based navigation for smart anchor links
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="relative min-h-screen bg-[url('/textures/dark_texture.png')]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#1a1a1a)]" />
      <>
        <GoldLine />

        <div id="hero">
          <HeroSection
            videoSources={videoSources}
            currentVideoIndex={currentVideoIndex}
            scrollToUserPaths={scrollToUserPaths}
          />
        </div>
        <GoldLine />
        <div id="about">
          <Section><ValuePropsSection /></Section>
        </div>
        <GoldLine />
        <div id="rating">
          <Section><div className="max-w-2xl mx-auto px-4"><PlayerRatingWidget /></div></Section>
        </div>
        <GoldLine />
        <div id="user-paths-section">
          <UserPathsSection
            onAuthModalOpen={onAuthModalOpen}
            onGuestModalOpen={openGuestModal}
          />
        </div>
        <GoldLine />
        <div id="calendar">
          <Section><div className="max-w-4xl mx-auto px-4"><TournamentCalendar /></div></Section>
        </div>
        <GoldLine />
        <div id="gallery">
          <Section><AtmosphereGallery /></Section>
        </div>
        <Section><div className="max-w-2xl mx-auto px-4"><FAQ /></div></Section>
        <GoldLine />
      </>
      
      <GuestFormModal isOpen={isGuestModalOpen} onClose={closeGuestModal} />
    </div>
  );
}
