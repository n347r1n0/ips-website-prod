// src/components/features/FAQ/FAQ.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react'; // Используем качественную иконку
import { PlayCircle } from 'lucide-react';

// Данные для нашего FAQ
const faqData = [
  {
    id: 1, // Добавляем ID для управления состоянием
    question: 'Это игра на деньги?',
    answer: 'Нет, IPS — это клуб спортивного покера. Взнос покрывает расходы на сервис и организацию мероприятия и не формирует призовой фонд.',
  },
  {
    id: 2,
    question: 'Какой у нас дресс-код?',
    answer: 'Мы придерживаемся стиля business casual для создания комфортной и деловой атмосферы на наших мероприятиях.',
  },
  {
    id: 3,
    question: 'Можно ли прийти новичку?',
    answer: 'Конечно. Наши профессиональные организаторы и дружелюбное сообщество всегда помогут разобраться в правилах и тонкостях игры.',
  },
  {
    id: 4,
    question: 'Что входит в стоимость участия?',
    answer: 'В стоимость входит место за игровым столом, работа профессионального дилера, фуршет с закусками и напитками, а также возможность для нетворкинга в элитном кругу.',
  },
];

// === Создаем анимируемую версию иконки. Делается один раз вне компонента. ===
const MotionPlayCircle = motion(PlayCircle);

// Отдельный компонент для одного элемента аккордеона (финальная версия)
function FaqItem({ item, onToggle, isOpen }) {
  const { question, answer, id } = item;
  const number = String(id).padStart(2, '0');

  // === ЕДИНАЯ ЛОГИКА ДЛЯ СВЕЧЕНИЯ ===
  const glowClasses = isOpen
    // Если ОТКРЫТО: красное свечение при наведении
    ? 'group-hover:[text-shadow:0_0_12px_#ee2346b3]'
    // Если ЗАКРЫТО: бирюзовое свечение при наведении
    : 'group-hover:[text-shadow:0_0_12px_#3333abaa]';

  return (
    <div className="border-b border-gold-accent/20 last:border-b-0">
      <div
        className={`
          my-2 rounded-2xl transition-shadow duration-300
          ${isOpen ? 'neumorphic-inset' : 'hover:neumorphic-outset'}
        `}
      >
        <button
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`faq-answer-${id}`}
          className="w-full py-6 text-left flex items-center justify-between gap-6 group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent/70 rounded-2xl"
        >
          <span className={`
            text-xl font-bold text-gold-accent/70 tabular-nums pl-6 transition-all duration-300
            ${glowClasses}
          `}>
            {number}
          </span>

          <h3
            className={`
              flex-1 text-xl font-syne font-semibold transition-all duration-300
              ${isOpen ? 'text-gold-accent' : 'text-white group-hover:text-gold-accent'}
              ${glowClasses}
            `}
          >
            {question}
          </h3>

          <div className="pr-6">
            <MotionPlayCircle
              className="w-7 h-7 text-gold-accent/80"
              aria-hidden="true"
              strokeWidth={1.5}
              // Задаем начальное состояние и анимацию напрямую
              initial={{ rotate: 90 }}
              animate={{ rotate: isOpen ? 150 : 90 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              // Стиль для гарантии вращения вокруг центра
              style={{ transformOrigin: "50% 50%" }}
            />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.section
              // ... (остальная часть секции без изменений) ...
              id={`faq-answer-${id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="overflow-hidden rounded-b-2xl"
            >
              <div className="px-6 pb-6">
                <div className="pl-16 text-white/80 font-garamond text-lg leading-relaxed max-w-3xl">
                  {answer}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Основной компонент FAQ (обновленная версия)
export function FAQ() {
  // Состояние для хранения ID открытого элемента
  const [openId, setOpenId] = useState(faqData[0].id); // Первый вопрос открыт по умолчанию

  return (
    <div>
      {/* === ШАПКА (ИЗМЕНЕНО) === */}
      <header className="mb-12 text-center"> {/* Убрали flex, добавили text-center */}
        <h2 className="text-4xl lg:text-5xl font-bold font-brand text-white gold-highlight">
          Частые вопросы
        </h2>
      </header>

      {/* === АККОРДЕОН (без изменений) === */}
      <div className="glassmorphic-panel rounded-3xl p-2 sm:p-4">
        {faqData.map((item) => (
          <FaqItem
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          />
        ))}
      </div>

      {/* === НОВЫЙ БЛОК-ФУТЕР (ДОБАВЛЕНО) === */}
      <footer className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-4 text-center">
        <p className="font-garamond text-xl text-white/70">
          Если не нашли ответ — спросите консьержа.
        </p>
        <a
          href="#registration-section"
          className="luxury-button px-6 py-3 rounded-xl whitespace-nowrap"
        >
          Задать вопрос
        </a>
      </footer>
    </div>
  );
}
