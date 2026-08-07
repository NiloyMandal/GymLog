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
        <div className="flex items-start gap-2">
          {/* Set indicator & Warmup */}
          <div className="flex flex-col items-center gap-1 shrink-0" style={{ width: '28px' }}>
            <div className="flex h-10 items-center justify-center">
              <span className="text-sm font-bold text-[var(--color-text-muted)]">
                {setNumber}
              </span>
            </div>
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
          <div className="flex-1 min-w-0 flex flex-col items-center">
            <div
              className={`flex h-10 w-full max-w-[110px] items-center overflow-hidden rounded-full border transition-colors ${
                completed ? 'border-transparent bg-black/5 dark:bg-white/5' : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] focus-within:border-[var(--color-accent)]'
              }`}
            >
              <button
                disabled={completed}
                onClick={() => onWeightChange(Math.max(0, (weight || 0) - weightStep))}
                className="flex h-full w-8 shrink-0 items-center justify-center text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] active:bg-[var(--color-bg-elevated)] disabled:opacity-30"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={weight === 0 ? '' : weight}
                onChange={(e) => onWeightChange(Math.max(0, Number(e.target.value)))}
                placeholder={ghostWeight || 0}
                disabled={completed}
                className="h-full min-w-0 flex-1 bg-transparent text-center text-base font-black text-[var(--color-text-primary)] focus:outline-none disabled:opacity-50 placeholder:text-[var(--color-text-muted)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                disabled={completed}
                onClick={() => onWeightChange((weight || 0) + weightStep)}
                className="flex h-full w-8 shrink-0 items-center justify-center text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] active:bg-[var(--color-bg-elevated)] disabled:opacity-30"
              >
                <Plus size={14} />
              </button>
            </div>
            {!completed && (
              <div className="flex justify-center mt-1">
                <button
                  onClick={() => setShowPlates(true)}
                  className="flex items-center gap-1 rounded-full bg-[var(--color-bg-elevated)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-white"
                >
                  <Disc size={10} /> Plates
                </button>
              </div>
            )}
          </div>

          {/* Reps stepper */}
          <div className="flex-1 min-w-0 flex flex-col items-center">
            <div
              className={`flex h-10 w-full max-w-[110px] items-center overflow-hidden rounded-full border transition-colors ${
                completed ? 'border-transparent bg-black/5 dark:bg-white/5' : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] focus-within:border-[var(--color-accent)]'
              }`}
            >
              <button
                disabled={completed}
                onClick={() => onRepsChange(Math.max(0, (reps || 0) - 1))}
                className="flex h-full w-8 shrink-0 items-center justify-center text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] active:bg-[var(--color-bg-elevated)] disabled:opacity-30"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={reps === 0 ? '' : reps}
                onChange={(e) => onRepsChange(Math.max(0, Number(e.target.value)))}
                placeholder={ghostReps || 0}
                disabled={completed}
                className="h-full min-w-0 flex-1 bg-transparent text-center text-base font-black text-[var(--color-text-primary)] focus:outline-none disabled:opacity-50 placeholder:text-[var(--color-text-muted)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                disabled={completed}
                onClick={() => onRepsChange((reps || 0) + 1)}
                className="flex h-full w-8 shrink-0 items-center justify-center text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] active:bg-[var(--color-bg-elevated)] disabled:opacity-30"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Complete button */}
          <button
            onClick={onComplete}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90 ${
              completed
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]'
            }`}
          >
            <Check size={18} strokeWidth={completed ? 3 : 2} />
          </button>
        </div>

        {/* Ghost data below steppers */}
        {!completed && ghostWeight != null && ghostReps != null && (
          <div className="mt-2 text-center">
            <span className="text-[10px] font-medium text-[var(--color-text-muted)] opacity-70">
              Last time: {ghostWeight} {unit} × {ghostReps}
            </span>
          </div>
        )}

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
