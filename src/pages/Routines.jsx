import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db, MUSCLE_GROUP_COLORS } from '../db';
import { Plus, Edit, Trash2, Dumbbell } from 'lucide-react';
import { useState } from 'react';

export default function Routines() {
  const routines = useLiveQuery(() => db.routines.toArray());
  const exercises = useLiveQuery(() => db.exercises.toArray());
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState(null);

  const exerciseMap = {};
  exercises?.forEach((ex) => { exerciseMap[ex.id] = ex; });

  const handleDelete = async () => {
    if (deleteId) {
      await db.routines.delete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-full px-4 pt-6 animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Routines</h1>
        <button
          onClick={() => navigate('/routines/new')}
          className="flex items-center gap-1 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-bold text-black transition-all active:scale-95"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      {routines?.length === 0 && (
        <div className="mt-16 text-center">
          <Dumbbell size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-muted)]">No routines yet</p>
        </div>
      )}

      <div className="space-y-3">
        {routines?.map((routine) => (
          <div
            key={routine.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 transition-all"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">{routine.name}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(`/routines/${routine.id}/edit`)}
                  className="rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => setDeleteId(routine.id)}
                  className="rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {routine.exercises?.map((re, i) => {
                const ex = exerciseMap[re.exerciseId];
                if (!ex) return null;
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: MUSCLE_GROUP_COLORS[ex.muscleGroup] }}
                    />
                    <span className="text-[var(--color-text-secondary)]">{ex.name}</span>
                    <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                      {re.targetSets}×{re.targetReps}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              {routine.exercises?.length || 0} exercises
            </p>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-[var(--color-bg-secondary)] p-6 animate-scale-in">
            <h2 className="mb-2 text-lg font-bold">Delete Routine?</h2>
            <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-[var(--color-danger)] py-3 text-sm font-bold text-white transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pb-8 pt-6 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          Made with ❤️ by Niloy
        </p>
      </div>
    </div>
  );
}
