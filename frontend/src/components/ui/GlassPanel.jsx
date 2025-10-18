// src/components/ui/GlassPanel.jsx


export function GlassPanel({ children }) {
  return (
    <div className="bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] rounded-[var(--r-2xl)] border border-[var(--glass-border)] p-4 sm:p-6 md:p-8 shadow-[var(--shadow-m)]">
      {children}
    </div>
  );
}
