// frontend/src/lib/sectionNav.js

/**
 * Находит DOM-узел секции по "смыслу" (id секции), а не по реализации.
 * Порядок поиска:
 *  1) [data-nav-id="<id>"]
 *  2) #section-<id>
 *  3) #<id>
 */
export function findSectionEl(id) {
  if (!id || typeof document === 'undefined') return null;

  // 1) Контрактный способ (предпочтительный)
  const byData = document.querySelector(`[data-nav-id="${id}"]`);
  if (byData) return byData;

  // 2) Текущая реализация SectionAnchor
  const byPrefixedId = document.getElementById(`section-${id}`);
  if (byPrefixedId) return byPrefixedId;

  // 3) Абсолютный фолбэк
  return document.getElementById(id);
}

/**
 * Плавный скролл к секции. Возвращает true, если узел найден.
 */
export function scrollToSection(id, options) {
  const el = findSectionEl(id);
  if (el) {
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      ...options,
    });
    return true;
  }
  return false;
}

/**
 * Извлекает "семантический" id секции из хэша.
 * Поддерживает "#hero" и "#section-hero".
 */
export function extractSectionIdFromHash(hash) {
  if (!hash) return null;
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return raw.startsWith('section-') ? raw.slice('section-'.length) : raw;
}
