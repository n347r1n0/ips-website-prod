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
  variant = 'neo', // 'neo' | 'glass' | 'clay'
  size = 'md', // 'sm' | 'md' | 'lg'
  gradient = null, // 'linear' | 'linear3' | 'conic' | 'elliptic'
  color = 'ocean', // 'red' | 'teal' | 'ocean' | 'sand' | 'royal' | 'porcelain'
  rounding = null, // Override with custom rounding like 'rounded-lg'
  loading = false,
  disabled = false,
  iconOnly = false,
  as: Component = 'button',
  ...props
}, ref) => {
  
  // Build class list
  const baseClasses = ['btn'];
  
  // Add variant
  baseClasses.push(`btn-${variant}`);
  
  // Add size
  baseClasses.push(`btn-${size}`);
  
  // Add icon-only modifier
  if (iconOnly) {
    baseClasses.push('btn-icon');
  }
  
  // Add color palette
  baseClasses.push(`btn-col-${color}`);
  
  // Add gradient if specified
  if (gradient) {
    baseClasses.push(`btn-grad-${gradient}`);
  }
  
  // Custom rounding override
  if (rounding) {
    baseClasses.push(rounding);
  }
  
  // Combine with custom className
  const finalClassName = cn(
    baseClasses.join(' '),
    className
  );

  return (
    <Component
      ref={ref}
      className={finalClassName}
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