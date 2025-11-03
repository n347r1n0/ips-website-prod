// frontend/src/ui/patterns/SectionAnchor.jsx

import React from 'react';

/**
 * SectionAnchor — оборачивает секцию, навешивает id и ref.
 * Добавлены scroll-margin, чтобы секция «прилипала» в удобное окно внимания.
 *
 * Почему так:
 *  - IntersectionObserver у вас смотрит в центр/нижнюю треть экрана (rootMargin).
 *  - scroll-margin-top/ bottom сдвигают точку остановки scrollIntoView,
 *    чтобы секция оказывалась целиком видимой и «под взглядом» IO.
 *
 * При желании отрегулируйте проценты под свой макет.
 */
export function SectionAnchor({ id, register, children }) {
  return (
    <div
      id={`section-${id}`}
      data-nav-id={id}
      ref={register(id)}
      className="section-anchor-offset"
    >
      {children}
    </div>
  );
}
