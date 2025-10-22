// src/components/features/AtmosphereGallery/AtmosphereGallery.jsx

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye } from "lucide-react";

const galleryImages = [
  { url: '/gallery/photo-1.jpg', alt: 'Сосредоточенные игроки за покерным столом' },
  { url: '/gallery/photo-2.jpg', alt: 'Стильные детали и аксессуары' },
  { url: '/gallery/photo-3.jpg', alt: 'Атмосферный лаунж' },
  { url: '/gallery/photo-4.jpg', alt: 'Макро-снимок карт и фишек' },
  { url: '/gallery/photo-5.jpg', alt: 'Серьезная игра' },
  { url: '/gallery/photo-6.jpg', alt: 'Нетворкинг в клубе' },
];


// 👇 СОЗДАЕМ ОТДЕЛЬНЫЙ КОМПОНЕНТ ДЛЯ ОДНОЙ КАРТОЧКИ ГАЛЕРЕИ
function GalleryItem({ image, onSelect, index }) {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isIconHovered, setIsIconHovered] = useState(false);

  return (
    <motion.div
      // Анимация появления
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      // Single hover control for synchronized animation
      onHoverStart={() => setIsCardHovered(true)}
      onHoverEnd={() => setIsCardHovered(false)}
    >
      <motion.div
        className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer gallery-card-panel"
        onClick={() => onSelect(image)}
        // Synchronized card transforms
        animate={{
          y: isCardHovered ? -4 : 0,
          scale: isCardHovered ? 1.05 : 1,
        }}
        transition={{ type: "tween", duration: 0.65, ease: "easeInOut" }}
      >
        <motion.div
          className="w-full h-full overflow-hidden"
          // Synchronized image transform with icon bonus
          animate={{
            scale: !isCardHovered ? 1 : !isIconHovered ? 1.1 : 1.21
          }}
          transition={{ type: "tween", duration: 0.65, ease: "easeInOut" }}
        >
          <img
            src={image.url}
            alt={image.alt}
            className="w-full h-full object-cover"
          />
        </motion.div>
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
          animate={{ opacity: isCardHovered ? 1 : 0 }}
          transition={{ type: "tween", duration: 0.65, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: isCardHovered ? 1 : 0 }}
          transition={{ type: "tween", duration: 0.65, ease: "easeInOut" }}
          style={{ pointerEvents: isCardHovered ? 'auto' : 'none' }}
        >
          <motion.div 
            className="glassmorphic-panel rounded-full p-4 border border-white/20 cursor-pointer"
            animate={{
              scale: isIconHovered ? 1.15 : 1,
              y: isIconHovered ? -2 : 0
            }}
            transition={{ 
              type: "tween", 
              duration: 0.65, 
              ease: "easeInOut",
              delay: 0 // Явно убираем любую задержку
            }}
            onHoverStart={() => setIsIconHovered(true)}
            onHoverEnd={() => setIsIconHovered(false)}
          >
            <Eye className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}


export function AtmosphereGallery() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <section className="relative"> {/* Убрали отступы, так как они теперь в Section */}
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-brand text-white mb-4 gold-highlight">
            Атмосфера клуба
          </h2>
          <p className="text-xl text-white/70 tracking-wide italic">
            "Погрузитесь в мир элегантного покера"
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="rounded-3xl p-8 content-contrast-reset"
        >

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {galleryImages.map((image, index) => (
              <GalleryItem
                key={index}
                image={image}
                index={index}
                onSelect={setSelectedImage}
              />
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="relative max-w-5xl max-h-[90vh] glassmorphic-panel rounded-3xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.url}
                alt={selectedImage.alt}
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-4 -right-4 p-3 glassmorphic-panel rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
