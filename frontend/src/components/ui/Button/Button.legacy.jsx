// src/components/ui/Button/Button.legacy.jsx

export function Button({ children, ...props }) {
  return (
    <button
      className="bg-yellow-500/80 text-black font-bold py-3 px-8 rounded-lg hover:bg-yellow-500/100 transition-colors shadow-lg"
      {...props}
    >
      {children}
    </button>
  );
}