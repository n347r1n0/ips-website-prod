// src/components/ui/Button/Button.jsx

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

// Simple utility for combining class names
function cn(...inputs) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const Button = forwardRef(({
  children,
  className = '',
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  as: Component = 'button',
  ...props
}, ref) => {
  
  // Build class list
  const classes = cn(
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    className
  );

  return (
    <Component
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      )}
      {children}
    </Component>
  );
});

Button.displayName = 'Button';

export { Button };