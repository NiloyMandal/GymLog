import { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { MUSCLE_GROUP_COLORS } from '../db';
export default function ExerciseDemoModal({
  isOpen,
  onClose,
  exercise,
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !exercise) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 transition-opacity backdrop-blur-sm sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-2xl border-t border-[var(--color-border)] bg-[#0a0a0f] shadow-2xl transition-transform sm:rounded-2xl sm:border animate-slide-up"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click close
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: MUSCLE_GROUP_COLORS[exercise.muscleGroup] || 'var(--color-accent)' }}
            >
              {exercise.muscleGroup}
            </span>
            <h3 className="text-lg font-bold leading-tight text-white">
              {exercise.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-[var(--color-bg-elevated)] p-2 text-[var(--color-text-muted)] transition-colors hover:text-white"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Media area */}
        <div className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden border-b border-[var(--color-border)] bg-black">
          {exercise.videoUrl ? (
            <img 
              src={exercise.videoUrl} 
              alt={exercise.name} 
              className="h-full w-full object-cover" 
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
              <AlertCircle size={16} />
              Animation not available
            </div>
          )}
        </div>

        {/* Form Cues */}
        <div className="max-h-60 overflow-y-auto p-5">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Key Form Cues
          </h4>
          {exercise.formCues && exercise.formCues.length > 0 ? (
            <ul className="space-y-2">
              {exercise.formCues.map((cue, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="font-black text-[var(--color-accent)]">•</span>
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No specific form cues available.</p>
          )}
        </div>

        {/* Footer Action */}
        <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 p-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[var(--color-accent)] py-3 text-sm font-bold uppercase tracking-wide text-black transition-colors active:scale-95 hover:bg-[var(--color-accent)]/90"
          >
            Back to Workout
          </button>
        </div>
      </div>
    </div>
  );
}
