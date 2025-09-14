// src/components/ui/Button.jsx

export function Button({ children, className = '', style = {}, onMouseEnter, onMouseLeave, ...props }) {
  const isLuxuryButton = className.includes('luxury-button');
  
  // Advanced neomorphic style for luxury buttons
  const luxuryStyle = isLuxuryButton ? {
    background: 'linear-gradient(145deg, #2c2c30, #1c1c1e)',
    boxShadow: `
      inset 0 3px 6px rgba(255,255,255,0.12),
      inset 0 -3px 6px rgba(0,0,0,0.4),
      0 6px 16px rgba(0,0,0,0.4),
      0 3px 8px rgba(0,0,0,0.3)
    `,
    border: '1px solid rgba(255,255,255,0.1)',
    ...style
  } : style;

  const handleMouseEnter = (e) => {
    if (isLuxuryButton) {
      e.currentTarget.style.boxShadow = `
        inset 0 3px 8px rgba(255,255,255,0.15),
        inset 0 -3px 8px rgba(0,0,0,0.5),
        0 8px 20px rgba(0,0,0,0.5),
        0 4px 10px rgba(0,0,0,0.4)
      `;
      e.currentTarget.style.transform = 'translateY(-1px)';
    }
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e) => {
    if (isLuxuryButton) {
      e.currentTarget.style.boxShadow = `
        inset 0 3px 6px rgba(255,255,255,0.12),
        inset 0 -3px 6px rgba(0,0,0,0.4),
        0 6px 16px rgba(0,0,0,0.4),
        0 3px 8px rgba(0,0,0,0.3)
      `;
      e.currentTarget.style.transform = 'translateY(0)';
    }
    onMouseLeave?.(e);
  };

  const baseClassName = isLuxuryButton 
    ? `text-white font-semibold transition-all duration-200 hover:brightness-110 active:scale-95 relative overflow-hidden ${className.replace('luxury-button', '').trim()}`
    : `bg-yellow-500/80 text-black font-bold py-3 px-8 rounded-lg hover:bg-yellow-500/100 transition-colors shadow-lg ${className}`;

  return (
    <button
      className={baseClassName}
      style={luxuryStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {isLuxuryButton && (
        <>
          {/* Subtle glow effect for luxury buttons */}
          <div className="absolute inset-0 rounded-inherit opacity-0 hover:opacity-25 transition-opacity duration-300"
               style={{background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)'}} />
          <span className="relative z-10">{children}</span>
        </>
      )}
      {!isLuxuryButton && children}
    </button>
  );
}
