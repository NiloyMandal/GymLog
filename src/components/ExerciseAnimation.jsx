import React, { useState, useEffect } from 'react';

export default function ExerciseAnimation({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length < 2) return;
    
    // Toggle between images every 800ms
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === 0 ? 1 : 0));
    }, 800);

    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg-primary)]">
        <span className="text-sm text-[var(--color-text-muted)]">No animation available</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative h-full w-full bg-[var(--color-bg-primary)]">
        <img 
          src={images[0]} 
          alt="Exercise demonstration"
          className="h-full w-full object-cover opacity-80 mix-blend-screen"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[var(--color-bg-primary)]">
      {/* 
        We render both images but toggle their opacity to avoid flashing 
        while the browser decodes the image. 
      */}
      <img
        src={images[0]}
        alt="Exercise start position"
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${
          currentIndex === 0 ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <img
        src={images[1]}
        alt="Exercise end position"
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${
          currentIndex === 1 ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
