import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS } from '../db';
import { useSettings } from '../hooks/useSettings';
import { isNewPR } from '../utils/pr';
import { displayWeight, inputToKg } from '../utils/units';
import SetLogger from '../components/SetLogger';
import RestTimer from '../components/RestTimer';
import Confetti from '../components/Confetti';
import ExerciseDemoModal from '../components/ExerciseDemoModal';
import {
  Play, Square, Plus, ChevronDown, ChevronUp, X,
  Clock, Dumbbell, Trophy, Search, Check, PlayCircle
} from 'lucide-react';

export default function LogWorkout() {
  const { settings } = useSettings();
  const routines = useLiveQuery(() => db.routines.toArray());
  const exercises = useLiveQuery(() => db.exercises.toArray());

  // Workout state
  const [phase, setPhase] = useState('start'); // 'start' | 'active' | 'done'
  const [selectedRoutineId, setSelectedRoutineId] = useState(null);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState('');

  // Wake lock ref
  const wakeLockRef = useRef(null);
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current !== null) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {
        console.warn('Wake Lock release error:', err);
      }
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && phase === 'active') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [phase, requestWakeLock]);

  useEffect(() => {
    if (phase === 'active') requestWakeLock();
    else releaseWakeLock();
    return () => releaseWakeLock();
  }, [phase, requestWakeLock, releaseWakeLock]);

  // Draft auto-resume
  useEffect(() => {
    async function loadDraft() {
      const draft = await db.draftWorkout.get(1);
      if (draft && phase === 'start') {
        setSelectedRoutineId(draft.routineId);
        setWorkoutExercises(draft.exercises);
        setStartTime(draft.startTime);
        setNotes(draft.notes || '');
        setPhase('active');
      }
    }
    loadDraft();
  }, [phase]);

  // Debounced auto-save draft
  const draftTimeoutRef = useRef(null);
  
  const flushDraft = useCallback(() => {
    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current);
      draftTimeoutRef.current = null;
    }
    if (phase === 'active' && startTime) {
      db.draftWorkout.put({
        id: 1,
        routineId: selectedRoutineId,
        exercises: workoutExercises,
        startTime,
        notes,
      });
    }
  }, [phase, selectedRoutineId, workoutExercises, startTime, notes]);

  useEffect(() => {
    if (phase === 'active' && startTime) {
      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
      draftTimeoutRef.current = setTimeout(() => {
        flushDraft();
      }, 500);
    } else if (phase === 'start' || phase === 'done') {
      db.draftWorkout.delete(1);
    }
  }, [phase, selectedRoutineId, workoutExercises, startTime, notes, flushDraft]);

  useEffect(() => {
    const handleUnload = () => {
      if (document.visibilityState === 'hidden') flushDraft();
    };
    document.addEventListener('visibilitychange', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [flushDraft]);

  // Rest timer
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);

  // Confetti
  const [showConfetti, setShowConfetti] = useState(false);
  const [prExerciseName, setPrExerciseName] = useState('');

  // Demo Modal
  const [demoExercise, setDemoExercise] = useState(null);

  // Add exercise modal
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Expanded exercise index
  const [expandedIdx, setExpandedIdx] = useState(0);

  // Elapsed timer
  useEffect(() => {
    if (phase !== 'active' || !startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, startTime]);

  // Set rest timer seconds from settings
  useEffect(() => {
    if (settings.restTimerSeconds) {
      setRestSeconds(settings.restTimerSeconds);
    }
  }, [settings.restTimerSeconds]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const loadGhostSets = async (exerciseId) => {
    const logs = await db.workoutLogs.where('exercises.exerciseId').equals(exerciseId).reverse().limit(1).toArray();
    if (logs.length > 0) {
      const exData = logs[0].exercises.find(e => e.exerciseId === exerciseId);
      if (exData && exData.sets) return exData.sets;
    }
    return [];
  };

  const startWorkout = useCallback(async (routineId) => {
    setSelectedRoutineId(routineId);
    setStartTime(Date.now());
    setPhase('active');

    if (routineId) {
      const routine = await db.routines.get(routineId);
      if (routine && routine.exercises) {
        const exerciseData = await Promise.all(
          routine.exercises.map(async (re) => {
            const ex = await db.exercises.get(re.exerciseId);
            const ghostSets = await loadGhostSets(re.exerciseId);
            return {
              exerciseId: re.exerciseId,
              name: ex?.name || 'Unknown',
              muscleGroup: ex?.muscleGroup || 'chest',
              videoUrl: ex?.videoUrl,
              formCues: ex?.formCues,
              ghostSets,
              sets: Array.from({ length: re.targetSets }, () => ({
                reps: re.targetReps,
                weight: 0,
                completed: false,
                isWarmup: false,
                rpe: null,
              })),
            };
          })
        );
        setWorkoutExercises(exerciseData);
      }
    } else {
      setWorkoutExercises([]);
    }
  }, []);

  const addExerciseToWorkout = useCallback(async (exercise) => {
    const ghostSets = await loadGhostSets(exercise.id);
    setWorkoutExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        videoUrl: exercise.videoUrl,
        formCues: exercise.formCues,
        ghostSets,
        sets: [{ reps: 10, weight: 0, completed: false, isWarmup: false, rpe: null }],
      },
    ]);
    setShowExercisePicker(false);
    setSearchTerm('');
    setExpandedIdx(workoutExercises.length);
  }, [workoutExercises.length]);

  const updateSet = useCallback((exIdx, setIdx, field, value) => {
    setWorkoutExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const sets = [...ex.sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      ex.sets = sets;
      next[exIdx] = ex;
      return next;
    });
  }, []);

  const completeSet = useCallback(async (exIdx, setIdx) => {
    let isCompleting = false;

    setWorkoutExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const sets = [...ex.sets];
      
      // Toggle completion
      isCompleting = !sets[setIdx].completed;
      sets[setIdx] = { ...sets[setIdx], completed: isCompleting };
      
      ex.sets = sets;
      next[exIdx] = ex;
      return next;
    });

    if (isCompleting) {
      // Check for PR
      const ex = workoutExercises[exIdx];
      const set = ex.sets[setIdx];
      const isPR = await isNewPR(ex.exerciseId, set.weight, set.reps, null);
      if (isPR && set.weight > 0) {
        setPrExerciseName(ex.name);
        setShowConfetti(true);
      }

      // Start rest timer
      setShowRestTimer(true);
    }
  }, [workoutExercises]);

  const addSet = useCallback((exIdx) => {
    setWorkoutExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const lastSet = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 0 };
      ex.sets = [...ex.sets, { reps: lastSet.reps, weight: lastSet.weight, completed: false, isWarmup: false, rpe: null }];
      next[exIdx] = ex;
      return next;
    });
  }, []);

  const removeExercise = useCallback((exIdx) => {
    setWorkoutExercises((prev) => prev.filter((_, i) => i !== exIdx));
    if (expandedIdx >= workoutExercises.length - 1) {
      setExpandedIdx(Math.max(0, workoutExercises.length - 2));
    }
  }, [expandedIdx, workoutExercises.length]);

  const finishWorkout = useCallback(async () => {
    const endTime = Date.now();
    const today = new Date().toISOString().split('T')[0];

    await db.workoutLogs.add({
      date: today,
      routineId: selectedRoutineId,
      exercises: workoutExercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
      })),
      startTime,
      endTime,
      notes,
    });

    // Update routine rotation
    if (routines && routines.length > 0) {
      const currentIdx = routines.findIndex((r) => r.id === selectedRoutineId);
      const nextIdx = (currentIdx + 1) % routines.length;
      await db.settings.put({ key: 'lastRoutineIndex', value: nextIdx });
    }

    setPhase('done');
  }, [selectedRoutineId, workoutExercises, startTime, notes, routines]);

  const resetWorkout = () => {
    setPhase('start');
    setWorkoutExercises([]);
    setStartTime(null);
    setElapsed(0);
    setNotes('');
    setSelectedRoutineId(null);
  };

  // Filter exercises for picker
  const filteredExercises = exercises?.filter((ex) => {
    if (!searchTerm) return true;
    return ex.name.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const groupedExercises = filteredExercises.reduce((acc, ex) => {
    if (!acc[ex.muscleGroup]) acc[ex.muscleGroup] = [];
    acc[ex.muscleGroup].push(ex);
    return acc;
  }, {});

  // ── START SCREEN ──
  if (phase === 'start') {
    return (
      <div className="min-h-full px-4 pt-6 animate-fade-in">
        <h1 className="mb-1 text-2xl font-bold">Start Workout</h1>
        <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
          Pick a routine or go freestyle
        </p>

        {/* Routine Cards */}
        <div className="mb-6 space-y-3">
          {routines?.map((routine) => (
            <button
              key={routine.id}
              onClick={() => startWorkout(routine.id)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-left transition-all duration-150 active:scale-[0.98] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-bg-elevated)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-bold">{routine.name}</h3>
                <Play size={20} className="text-[var(--color-accent)]" />
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {routine.exercises?.length || 0} exercises
              </p>
            </button>
          ))}
        </div>

        {/* Freestyle */}
        <button
          onClick={() => startWorkout(null)}
          className="w-full rounded-2xl border-2 border-dashed border-[var(--color-border-light)] bg-transparent p-5 text-center transition-all duration-150 active:scale-[0.98] hover:border-[var(--color-accent)]/40"
        >
          <Plus size={24} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Freestyle Workout
          </span>
        </button>
      </div>
    );
  }

  // ── DONE SCREEN ──
  if (phase === 'done') {
    const totalSets = workoutExercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0
    );
    const totalVolume = workoutExercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) =>
        s + (set.completed ? set.weight * set.reps : 0), 0
      ), 0
    );

    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4 animate-fade-in">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent)]/10">
          <Trophy size={40} className="text-[var(--color-accent)] animate-bounce-in" />
        </div>
        <h1 className="mb-2 text-3xl font-black">Workout Complete!</h1>
        <p className="mb-8 text-[var(--color-text-secondary)]">Great work 💪</p>

        <div className="mb-8 grid w-full max-w-sm grid-cols-3 gap-4">
          <div className="rounded-xl bg-[var(--color-bg-card)] p-4 text-center">
            <p className="text-2xl font-black text-[var(--color-accent)]">{formatTime(elapsed)}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Duration</p>
          </div>
          <div className="rounded-xl bg-[var(--color-bg-card)] p-4 text-center">
            <p className="text-2xl font-black text-[var(--color-accent)]">{totalSets}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Sets</p>
          </div>
          <div className="rounded-xl bg-[var(--color-bg-card)] p-4 text-center">
            <p className="text-2xl font-black text-[var(--color-accent)]">{totalVolume.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{settings.unit}</p>
          </div>
        </div>

        <button
          onClick={resetWorkout}
          className="rounded-xl bg-[var(--color-accent)] px-8 py-3 font-bold text-black transition-all active:scale-95"
        >
          Done
        </button>
      </div>
    );
  }

  // ── ACTIVE WORKOUT ──
  return (
    <div className="min-h-full animate-fade-in">
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/95 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[var(--color-accent)]" />
          <span className="font-mono text-lg font-bold text-[var(--color-accent)]">
            {formatTime(elapsed)}
          </span>
        </div>
        <button
          onClick={finishWorkout}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-black transition-all active:scale-95"
        >
          Finish
        </button>
      </div>

      {/* Exercises */}
      <div className="px-4 py-4 space-y-3">
        {workoutExercises.map((ex, exIdx) => {
          const isExpanded = expandedIdx === exIdx;
          const completedSets = ex.sets.filter((s) => s.completed).length;

          return (
            <div
              key={exIdx}
              className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] transition-all"
            >
              {/* Exercise Header */}
              <div className="flex w-full items-center justify-between px-4 py-3.5">
                <button
                  onClick={() => setExpandedIdx(isExpanded ? -1 : exIdx)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: MUSCLE_GROUP_COLORS[ex.muscleGroup] }}
                  />
                  <div>
                    <h3 className="font-bold">{ex.name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {completedSets}/{ex.sets.length} sets done
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDemoExercise(ex);
                    }}
                    className="p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                    aria-label="View exercise demo"
                  >
                    <PlayCircle size={18} />
                  </button>
                  {completedSets === ex.sets.length && ex.sets.length > 0 && (
                    <Check size={16} className="text-[var(--color-success)]" />
                  )}
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? -1 : exIdx)}
                    className="p-1"
                  >
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-[var(--color-text-muted)]" />
                    ) : (
                      <ChevronDown size={18} className="text-[var(--color-text-muted)]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sets */}
              {isExpanded && (
                <div className="border-t border-[var(--color-border)] px-4 pb-4 pt-3 animate-fade-in">
                  {/* Column headers */}
                  <div className="mb-2 grid grid-cols-[1fr_2fr_2fr_auto] items-center gap-2 px-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                      Set
                    </span>
                    <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                      {settings.unit}
                    </span>
                    <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                      Reps
                    </span>
                    <span className="w-12" />
                  </div>

                  {ex.sets.map((set, setIdx) => {
                    const ghost = ex.ghostSets?.[setIdx] || ex.ghostSets?.[ex.ghostSets.length - 1];
                    return (
                      <SetLogger
                        key={setIdx}
                        setNumber={setIdx + 1}
                        weight={set.weight === 0 ? 0 : displayWeight(set.weight, settings.unit)}
                        reps={set.reps}
                        completed={set.completed}
                        isWarmup={set.isWarmup}
                        rpe={set.rpe}
                        ghostWeight={ghost ? displayWeight(ghost.weight, settings.unit) : null}
                        ghostReps={ghost ? ghost.reps : null}
                        unit={settings.unit}
                        trackRPE={settings.trackRPE}
                        onWeightChange={(v) => updateSet(exIdx, setIdx, 'weight', inputToKg(v, settings.unit))}
                        onRepsChange={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                        onWarmupChange={(v) => updateSet(exIdx, setIdx, 'isWarmup', v)}
                        onRpeChange={(v) => updateSet(exIdx, setIdx, 'rpe', v)}
                        onComplete={() => completeSet(exIdx, setIdx)}
                      />
                    );
                  })}

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => addSet(exIdx)}
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10"
                    >
                      <Plus size={14} /> Add Set
                    </button>
                    <button
                      onClick={() => removeExercise(exIdx)}
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10"
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Exercise Button */}
        <button
          onClick={() => setShowExercisePicker(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-border-light)] bg-transparent p-4 text-sm font-medium text-[var(--color-text-secondary)] transition-all active:scale-[0.98] hover:border-[var(--color-accent)]/40"
        >
          <Plus size={18} /> Add Exercise
        </button>

        {/* Notes */}
        <div className="mt-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Workout notes (optional)..."
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)]/50 focus:outline-none"
            rows={2}
          />
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-t-3xl bg-[var(--color-bg-secondary)] animate-slide-up" style={{ maxHeight: '80dvh' }}>
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
              <h2 className="text-lg font-bold">Add Exercise</h2>
              <button
                onClick={() => { setShowExercisePicker(false); setSearchTerm(''); }}
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
                      onClick={() => addExerciseToWorkout(ex)}
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

      {/* Rest Timer */}
      {showRestTimer && (
        <RestTimer
          seconds={restSeconds}
          onDone={() => setShowRestTimer(false)}
          onSkip={() => setShowRestTimer(false)}
        />
      )}

      {/* Confetti */}
      {showConfetti && <Confetti exerciseName={prExerciseName} />}

      {/* Demo Modal */}
      <ExerciseDemoModal
        isOpen={!!demoExercise}
        onClose={() => setDemoExercise(null)}
        exercise={demoExercise}
      />
    </div>
  );
}
