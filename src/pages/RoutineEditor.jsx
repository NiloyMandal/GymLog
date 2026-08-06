import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS, MUSCLE_GROUPS } from '../db';
import { ArrowLeft, Plus, X, GripVertical, ChevronUp, ChevronDown, Search } from 'lucide-react';

export default function RoutineEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const exercises = useLiveQuery(() => db.exercises.toArray());

  const [name, setName] = useState('');
  const [routineExercises, setRoutineExercises] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load existing routine
  useEffect(() => {
    if (isEditing) {
      db.routines.get(id).then((routine) => {
        if (routine) {
          setName(routine.name);
          setRoutineExercises(routine.exercises || []);
        }
      });
    }
  }, [id, isEditing]);

  const exerciseMap = {};
  exercises?.forEach((ex) => { exerciseMap[ex.id] = ex; });

  const filteredExercises = exercises?.filter((ex) => {
    if (!searchTerm) return true;
    return ex.name.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const groupedExercises = filteredExercises.reduce((acc, ex) => {
    if (!acc[ex.muscleGroup]) acc[ex.muscleGroup] = [];
    acc[ex.muscleGroup].push(ex);
    return acc;
  }, {});

  const addExercise = (exercise) => {
    setRoutineExercises((prev) => [
      ...prev,
      { exerciseId: exercise.id, targetSets: 3, targetReps: 10 },
    ]);
    setShowPicker(false);
    setSearchTerm('');
  };

  const removeExercise = (idx) => {
    setRoutineExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveExercise = (idx, direction) => {
    setRoutineExercises((prev) => {
      const next = [...prev];
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const updateExercise = (idx, field, value) => {
    setRoutineExercises((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      exercises: routineExercises,
    };

    if (isEditing) {
      await db.routines.update(id, data);
    } else {
      await db.routines.add({ id: crypto.randomUUID(), ...data });
    }
    navigate('/routines');
  };

  return (
    <div className="min-h-full px-4 pt-4 animate-fade-in">
      <button
        onClick={() => navigate('/routines')}
        className="mb-4 flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="mb-5 text-2xl font-bold">
        {isEditing ? 'Edit Routine' : 'New Routine'}
      </h1>

      {/* Name */}
      <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
        Routine Name
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Upper Body A"
        className="mb-6 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm focus:border-[var(--color-accent)]/50 focus:outline-none"
      />

      {/* Exercise List */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          Exercises ({routineExercises.length})
        </h2>
      </div>

      <div className="mb-4 space-y-2">
        {routineExercises.map((re, idx) => {
          const ex = exerciseMap[re.exerciseId];
          if (!ex) return null;

          return (
            <div
              key={idx}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: MUSCLE_GROUP_COLORS[ex.muscleGroup] }}
                  />
                  <span className="text-sm font-medium">{ex.name}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => moveExercise(idx, -1)}
                    disabled={idx === 0}
                    className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveExercise(idx, 1)}
                    disabled={idx === routineExercises.length - 1}
                    className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={() => removeExercise(idx)}
                    className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--color-text-muted)]">Sets</label>
                  <input
                    type="number"
                    value={re.targetSets}
                    onChange={(e) => updateExercise(idx, 'targetSets', Math.max(1, Number(e.target.value)))}
                    className="h-8 w-14 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-center text-sm font-bold focus:border-[var(--color-accent)] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
                <span className="text-[var(--color-text-muted)]">×</span>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--color-text-muted)]">Reps</label>
                  <input
                    type="number"
                    value={re.targetReps}
                    onChange={(e) => updateExercise(idx, 'targetReps', Math.max(1, Number(e.target.value)))}
                    className="h-8 w-14 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-center text-sm font-bold focus:border-[var(--color-accent)] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowPicker(true)}
        className="mb-8 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border-light)] bg-transparent p-3 text-sm font-medium text-[var(--color-text-secondary)] transition-all active:scale-[0.98] hover:border-[var(--color-accent)]/40"
      >
        <Plus size={16} /> Add Exercise
      </button>

      {/* Save/Cancel */}
      <div className="flex gap-3 pb-8">
        <button
          onClick={() => navigate('/routines')}
          className="flex-1 rounded-xl border border-[var(--color-border)] py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-all active:scale-95"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || routineExercises.length === 0}
          className="flex-1 rounded-xl bg-[var(--color-accent)] py-3 text-sm font-bold text-black transition-all active:scale-95 disabled:opacity-40"
        >
          {isEditing ? 'Save Changes' : 'Create Routine'}
        </button>
      </div>

      {/* Exercise Picker */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-t-3xl bg-[var(--color-bg-secondary)] animate-slide-up" style={{ maxHeight: '80dvh' }}>
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
              <h2 className="text-lg font-bold">Add Exercise</h2>
              <button
                onClick={() => { setShowPicker(false); setSearchTerm(''); }}
                className="rounded-full p-2 hover:bg-[var(--color-bg-elevated)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-4 py-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-3 pl-10 pr-4 text-sm focus:border-[var(--color-accent)]/50 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: '55dvh' }}>
              {Object.entries(groupedExercises).map(([group, exs]) => (
                <div key={group} className="mb-4">
                  <h3
                    className="mb-2 text-xs font-bold uppercase tracking-wider"
                    style={{ color: MUSCLE_GROUP_COLORS[group] }}
                  >
                    {MUSCLE_GROUP_LABELS[group]}
                  </h3>
                  {exs.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => addExercise(ex)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-[var(--color-bg-elevated)] active:bg-[var(--color-bg-elevated)]"
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: MUSCLE_GROUP_COLORS[ex.muscleGroup] }}
                      />
                      {ex.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
