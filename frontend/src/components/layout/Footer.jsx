// src/components/layout/Footer.jsx

import React from "react";
import { Phone, Mail, MapPin, Clock, Instagram, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const quickLinks = [
    { label: 'О клубе', id: 'about' },
    { label: 'Календарь турниров', id: 'calendar' },
    { label: 'Рейтинг игроков', id: 'rating' },
    { label: 'Галерея', id: 'gallery' }
  ];

  const contactInfo = [
    { icon: Phone, label: '+7 (495) 123-45-67', href: 'tel:+74951234567' },
    { icon: Mail, label: 'info@ipspoker.ru', href: 'mailto:info@ipspoker.ru' },
    { icon: MapPin, label: 'Москва, Садовническая наб., 77', href: '#' },
    { icon: Clock, label: 'Ежедневно с 18:00 до 02:00', href: '#' }
  ];

  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com/ipspoker', label: 'Instagram' },
    { icon: Send, href: 'https://t.me/ipspoker', label: 'Telegram' }
  ];

  return (
    <footer className="relative py-16 mt-20">
{/*       <div className="art-deco-divider mb-16" /> */}

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="glassmorphic-panel rounded-3xl p-8 lg:p-12"
        >
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12">

            {/* Brand Section */}
            <div className="lg:col-span-1">

              <div className="mb-6">
                  <img
                      src="/logo/Logo_IPS.svg"
                      alt="International Poker Style Logo"
                      className="h-16 w-auto"
                  />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed font-body mb-6">
                Премиальный покерный клуб в Москве. Место, где интеллект встречается со стилем, а игра становится искусством.
              </p>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="w-12 h-12 glassmorphic-panel rounded-xl flex items-center justify-center text-gray-400 hover:text-gold-accent transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6 font-headline">
                Быстрые ссылки
              </h3>
              <ul className="space-y-4">
                {quickLinks.map((link) => (
                  <li key={link.id}>
                    <button
                      onClick={() => scrollToSection(link.id)}
                      className="text-gray-300 hover:text-gold-accent transition-colors font-body text-lg group flex items-center"
                    >
                      <span className="w-0 group-hover:w-4 h-0.5 bg-gold-accent transition-all duration-300 mr-0 group-hover:mr-3"></span>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-white mb-6 font-headline">
                Контактная информация
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {contactInfo.map((contact) => {
                  const Icon = contact.icon;
                  return (
                    <motion.div
                      key={contact.label}
                      whileHover={{ x: 5 }}
                      className="flex items-center space-x-4 p-4 glassmorphic-panel rounded-xl hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-10 h-10 glassmorphic-panel rounded-lg flex items-center justify-center text-gold-accent group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        {contact.href !== '#' ? (
                          <a
                            href={contact.href}
                            className="text-gray-300 hover:text-white transition-colors font-body text-lg"
                          >
                            {contact.label}
                          </a>
                        ) : (
                          <span className="text-gray-300 font-body text-lg">
                            {contact.label}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="art-deco-divider mt-4 mb-2" />

          <div className="flex flex-col md:flex-row justify-between items-center pt-8">
            <p className="text-gray-400 font-body text-lg mb-4 md:mb-0">
              © 2025 International Poker Style. Все права защищены.
            </p>
            <div className="flex space-x-6 text-gray-400 font-body text-lg">
              <button className="hover:text-gold-accent transition-colors">
                Правила клуба
              </button>
              <button className="hover:text-gold-accent transition-colors">
                Конфиденциальность
              </button>
              <a href="/legal/oferta" className="hover:text-gold-accent transition-colors">
                Договор оферты
              </a>
            </div>
          </div>
        </motion.div>
        {/* Scroll buffer, чтобы плавающий виджет не наезжал на футер */}
        <div className="pointer-events-none h-[var(--footer-scroll-buffer)]" aria-hidden="true" />
      </div>
    </footer>
  );
}
