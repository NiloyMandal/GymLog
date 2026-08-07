import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

export default function RestTimer({ seconds, onDone, onSkip }) {
  const [remaining, setRemaining] = useState(seconds);
  const targetEndTimeRef = useRef(Date.now() + seconds * 1000);
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);

  const playAlerts = useCallback(() => {
    // 1. Haptic vibration if supported (e.g. Android)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }

    // 2. Audio beeps
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;

      // Play 3 short beeps
      [0, 0.2, 0.4].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.15);
      });
    } catch (e) {
      // Audio API not available
    }
  }, []);

  useEffect(() => {
    // Calculate off the fixed target to avoid iOS background throttling issues
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const left = Math.ceil((targetEndTimeRef.current - now) / 1000);
      
      if (left <= 0) {
        clearInterval(intervalRef.current);
        setRemaining(0);
        playAlerts();
        setTimeout(onDone, 600);
      } else {
        setRemaining(left);
      }
    }, 100); // check more frequently to stay accurate on wake

    return () => {
      clearInterval(intervalRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [onDone, playAlerts]);

  const progress = 1 - remaining / seconds;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 flex items-center gap-4 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-primary)]/90 px-4 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-md animate-slide-up">
      {/* Mini Circular progress */}
      <div className="relative flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="14" cy="14" r="12"
            fill="none" stroke="var(--color-border)" strokeWidth="2.5"
          />
          {/* Progress circle */}
          <circle
            cx="14" cy="14" r="12"
            fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 12}
            strokeDashoffset={2 * Math.PI * 12 * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] leading-none mb-0.5">
          Rest
        </span>
        <span className="font-mono text-base font-black tabular-nums leading-none text-[var(--color-text-primary)]">
          {minutes}:{secs.toString().padStart(2, '0')}
        </span>
      </div>

      <div className="h-6 w-px bg-[var(--color-border)] mx-1" />

      <button
        onClick={onSkip}
        className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold text-[var(--color-text-muted)] transition-colors active:scale-95 hover:text-[var(--color-text-primary)]"
      >
        <X size={14} strokeWidth={3} /> Skip
      </button>
    </div>
  );
}
