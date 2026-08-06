import { Minus, Plus, Check, Disc, Flame } from 'lucide-react';
import { useState } from 'react';
import PlateCalculator from './PlateCalculator';

export default function SetLogger({
  setNumber,
  weight,
  reps,
  completed,
  isWarmup,
  rpe,
  ghostWeight,
  ghostReps,
  unit,
  trackRPE,
  onWeightChange,
  onRepsChange,
  onWarmupChange,
  onRpeChange,
  onComplete,
}) {
  const [showPlates, setShowPlates] = useState(false);
  const weightStep = unit === 'kg' ? 2.5 : 5;

  return (
    <>
      <div
        className={`mb-2 rounded-xl px-2 py-3 transition-all ${
          completed ? 'bg-[var(--color-accent)]/5 opacity-60' : 'bg-[var(--color-bg-card)] border border-[var(--color-border)]'
        }`}
      >
        <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-3">
          {/* Set indicator & Warmup */}
          <div className="flex flex-col items-center justify-center gap-1 w-8">
            <span className="text-sm font-bold text-[var(--color-text-muted)]">
              {setNumber}
            </span>
            <button
              onClick={() => onWarmupChange(!isWarmup)}
              className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                isWarmup ? 'text-orange-500 bg-orange-500/10' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)]'
              }`}
              title="Toggle Warm-up"
            >
              <Flame size={14} strokeWidth={isWarmup ? 3 : 2} />
            </button>
          </div>

          {/* Weight stepper */}
          <div className="flex flex-col gap-1 relative">
            <div className="flex items-center justify-center gap-1">
              <button
                disabled={completed}
                onClick={() => onWeightChange(Math.max(0, (weight || 0) - weightStep))}
                className="flex h-10 w-9 items-center justify-center rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] transition-all active:scale-90 disabled:opacity-30"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={weight === 0 ? '' : weight}
                onChange={(e) => onWeightChange(Math.max(0, Number(e.target.value)))}
                placeholder={ghostWeight || 0}
                disabled={completed}
                className="h-10 w-14 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-center text-lg font-black text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50 placeholder:text-[var(--color-text-muted)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                disabled={completed}
                onClick={() => onWeightChange((weight || 0) + weightStep)}
                className="flex h-10 w-9 items-center justify-center rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] transition-all active:scale-90 disabled:opacity-30"
              >
                <Plus size={16} />
              </button>
            </div>
            {!completed && (
              <button
                onClick={() => setShowPlates(true)}
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-[var(--color-bg-elevated)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-white"
              >
                <Disc size={10} /> Plates
              </button>
            )}
          </div>

          {/* Reps stepper */}
          <div className="flex items-center justify-center gap-1">
            <button
              disabled={completed}
              onClick={() => onRepsChange(Math.max(0, (reps || 0) - 1))}
              className="flex h-10 w-9 items-center justify-center rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] transition-all active:scale-90 disabled:opacity-30"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              value={reps === 0 ? '' : reps}
              onChange={(e) => onRepsChange(Math.max(0, Number(e.target.value)))}
              placeholder={ghostReps || 0}
              disabled={completed}
              className="h-10 w-14 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-center text-lg font-black text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50 placeholder:text-[var(--color-text-muted)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              disabled={completed}
              onClick={() => onRepsChange((reps || 0) + 1)}
              className="flex h-10 w-9 items-center justify-center rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] transition-all active:scale-90 disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Complete button */}
          <button
            onClick={onComplete}
            className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all active:scale-90 ${
              completed
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]'
            }`}
          >
            <Check size={20} strokeWidth={completed ? 3 : 2} />
          </button>
        </div>

        {/* Optional RPE Selector */}
        {trackRPE && !completed && (
          <div className="mt-5 flex items-center justify-center gap-2 border-t border-[var(--color-border)]/50 pt-3">
            <span className="text-xs font-bold uppercase text-[var(--color-text-muted)]">RPE</span>
            {[7, 8, 9, 10].map((val) => (
              <button
                key={val}
                onClick={() => onRpeChange(rpe === val ? null : val)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                  rpe === val
                    ? 'bg-blue-500 text-white'
                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        )}
      </div>

      {showPlates && (
        <PlateCalculator weight={weight || 0} onClose={() => setShowPlates(false)} />
      )}
    </>
  );
}
