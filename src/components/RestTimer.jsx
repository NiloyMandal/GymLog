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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-bg-primary)]/95 backdrop-blur-xl animate-fade-in">
      <p className="mb-6 text-sm font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
        Rest Timer
      </p>

      {/* Circular progress */}
      <div className="relative mb-8">
        <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(163, 230, 53, 0.4))',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-black tabular-nums">
            {minutes}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <button
        onClick={onSkip}
        className="flex items-center gap-2 rounded-xl bg-[var(--color-bg-elevated)] px-6 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-all active:scale-95 hover:bg-[var(--color-bg-tertiary)]"
      >
        <X size={16} /> Skip
      </button>
    </div>
  );
}
