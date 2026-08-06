import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';

export default function Confetti({ exerciseName }) {
  useEffect(() => {
    // Fire confetti bursts
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none">
      <div className="animate-bounce-in rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-accent)]/30 px-6 py-4 text-center shadow-2xl shadow-[var(--color-accent)]/10">
        <Trophy size={32} className="mx-auto mb-2 text-[var(--color-accent)]" />
        <p className="text-lg font-black text-[var(--color-accent)]">New PR! 🎉</p>
        <p className="text-sm text-[var(--color-text-secondary)]">{exerciseName}</p>
      </div>
    </div>
  );
}
