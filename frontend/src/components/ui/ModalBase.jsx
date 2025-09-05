import { useEffect } from 'react';
import { createPortal } from 'react-dom';

function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return;
    const y = window.scrollY;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.classList.add('overflow-hidden');
    return () => {
      body.classList.remove('overflow-hidden');
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      window.scrollTo(0, y);
    };
  }, [locked]);
}

export default function ModalBase({
  open,
  onClose,
  title,
  children,
  footer,          // ReactNode: sticky внизу
  showBack = false,
  onBack,
  mobileFull = true,  // полноэкранно на мобиле
}) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => (e.key === 'Escape' ? onClose?.() : null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] p-4 md:p-6 grid place-items-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel wrapper */}
      <div
        className={[
          'relative w-full outline-none',
          mobileFull ? 'h-[100dvh] max-h-[100dvh] md:h-auto' : '',
          'md:w-[min(820px,92vw)]',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Панель: мягкий неоморфизм (слоистые тени + тёмная «резина») */}
        <div
          className={[
            'flex h-full flex-col overflow-hidden',
            'rounded-none md:rounded-2xl border border-white/10',
            'shadow-[0_30px_80px_rgba(0,0,0,0.6),inset_0_1px_rgba(255,255,255,0.05),inset_0_-1px_rgba(0,0,0,0.45)]',
            'bg-[linear-gradient(180deg,rgba(28,28,30,0.96),rgba(16,16,18,0.96))]',
          ].join(' ')}
        >
          {/* Header (sticky) */}
          <div className="sticky top-0 z-[1020] px-5 py-4 border-b border-white/10 bg-[rgba(18,18,20,0.92)] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {showBack && (
                <button
                  onClick={onBack}
                  aria-label="Назад"
                  className="h-9 w-9 rounded-full border border-white/15 hover:bg-white/5"
                >
                  ‹
                </button>
              )}
              <h2 className="text-xl font-semibold">{title}</h2>
              <div className="ml-auto">
                <button
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="h-9 w-9 rounded-full border border-white/15 hover:bg-white/5"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          {/* Content (scroll-only) */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {children}
            {/* безопасная зона снизу для iOS, чтобы контент не упирался под CTA */}
            <div className="pb-[max(env(safe-area-inset-bottom),1rem)]" />
          </div>

          {/* Footer (sticky) */}
          {footer && (
            <div className="sticky bottom-0 z-[1020] px-5 py-4 border-t border-white/10 bg-[rgba(18,18,20,0.92)] backdrop-blur-sm">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
