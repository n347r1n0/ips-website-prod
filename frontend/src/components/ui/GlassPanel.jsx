// src/components/ui/GlassPanel.jsx

export function GlassPanel({ children }) {
  return (
    <div className="bg-[--glass-bg] backdrop-blur-[var(--glass-blur)] rounded-[var(--r-2xl)] border border-[--glass-border] p-4 sm:p-6 md:p-8 shadow-[var(--shadow-m)]">
      {children}
    </div>
  );
}


// // src/components/ui/GlassPanel.jsx
//
// export function GlassPanel({ children }) {
//   return (
//     <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-lg">
//       {children}
//     </div>
//   );
// }
