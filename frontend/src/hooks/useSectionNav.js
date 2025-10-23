// frontend/src/hooks/useSectionNav.js

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useSectionNav(ids)
 *  - activeId: текущая видимая секция
 *  - scrollTo(id): плавный скролл к секции
 *  - register(id): ref-callback для привязки к DOM-узлу секции
 */
export function useSectionNav(ids = []) {
  const [activeId, setActiveId] = useState(ids[0] || null);
  const nodesRef = useRef(new Map());

  const register = useCallback((id) => (node) => {
    if (node) nodesRef.current.set(id, node);
    else nodesRef.current.delete(id);
  }, []);

  const scrollTo = useCallback((id) => {
    const el = nodesRef.current.get(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (!ids.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = Array.from(nodesRef.current.entries())
              .find(([, n]) => n === e.target)?.[0];
            if (id) setActiveId(id);
          }
        });
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: 0.01 } // «окно внимания»
    );

    ids.forEach((id) => {
      const n = nodesRef.current.get(id);
      if (n) obs.observe(n);
    });
    return () => obs.disconnect();
  }, [ids]);

  return { activeId, scrollTo, register };
}
