// src/components/ui/Button/Button.jsx

import React, { forwardRef } from 'react';

// Dumb Button - just passes through className and props
export const Button = forwardRef(({ className = '', ...props }, ref) => {
  return <button ref={ref} className={className} {...props} />;
});

Button.displayName = 'Button';