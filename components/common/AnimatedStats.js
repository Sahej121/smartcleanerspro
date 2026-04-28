'use client';

import React, { useState, useEffect, useRef } from 'react';

export function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1200, locale = 'en-IN' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
    if (num === 0) { setDisplay(0); return; }
    
    let start = 0;
    const startTime = performance.now();
    
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (num - start) * eased);
      setDisplay(current);
      if (progress < 1) ref.current = requestAnimationFrame(step);
    }
    
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  
  return <>{prefix}{display.toLocaleString(locale)}{suffix}</>;
}

export function AnimatedTotal({ value, prefix = '₹', duration = 600, locale = 'en-IN' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = display;
    const startTime = performance.now();
    
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (value - start) * eased);
      setDisplay(current);
      if (progress < 1) ref.current = requestAnimationFrame(step);
    }
    
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  
  return <>{prefix}{display.toLocaleString(locale)}</>;
}
