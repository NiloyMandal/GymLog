import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS, MUSCLE_GROUPS } from '../db';
import {
  Search, Plus, X, ArrowLeft,
  Dumbbell, Zap, Heart, Footprints, Target, Flame, Activity
} from 'lucide-react';
import ExerciseDemoModal from '../components/ExerciseDemoModal';

// Lucide icons for each muscle group
const MUSCLE_GROUP_ICONS = {
  chest: Dumbbell,
  back: Target,
  legs: Footprints,
  shoulders: Zap,
  arms: Dumbbell,
  core: Flame,
  cardio: Activity,
};

// Lazy image component — only loads the GIF when scrolled into view
function LazyGif({ src, alt, className }) {
  const imgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isVisible && !error ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`h-full w-full object-contain transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : null}

      {/* Placeholder while loading */}
      {(!loaded || error) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {error ? (
            <Dumbbell size={28} className="text-[var(--color-text-muted)]/30" />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}

export default function ExerciseLibrary() {
  const exercises = useLiveQuery(() => db.exercises.toArray());
  const navigate = useNavigate();
  const location = useLocation();
  const isPickMode = new URLSearchParams(location.search).get('pick') === '1';

  // State
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [demoExercise, setDemoExercise] = useState(null);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('chest');

  // Grouped counts
  const groupCounts = useMemo(() => {
    if (!exercises) return {};
    const counts = {};
    MUSCLE_GROUPS.forEach((g) => {
      counts[g] = exercises.filter((e) => e.muscleGroup === g).length;
    });
    return counts;
  }, [exercises]);

  // Get a preview GIF for each muscle group (first exercise with a videoUrl)
  const groupPreviews = useMemo(() => {
    if (!exercises) return {};
    const previews = {};
    MUSCLE_GROUPS.forEach((g) => {
      const ex = exercises.find((e) => e.muscleGroup === g && e.videoUrl);
      previews[g] = ex?.videoUrl || null;
    });
    return previews;
  }, [exercises]);

  // Filtered exercises for the selected group
  const groupExercises = useMemo(() => {
    if (!selectedGroup || !exercises) return [];
    return exercises
      .filter((ex) => ex.muscleGroup === selectedGroup)
      .filter((ex) =>
        searchTerm
          ? ex.name.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedGroup, exercises, searchTerm]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await db.exercises.add({
      id: crypto.randomUUID(),
      name: newName.trim(),
      muscleGroup: newGroup,
      defaultUnit: 'kg',
    });
    setNewName('');
    setShowAdd(false);
  };

  const handleBack = useCallback(() => {
    setSelectedGroup(null);
    setSearchTerm('');
  }, []);

  // ── MUSCLE GROUP GRID VIEW ──
  if (!selectedGroup) {
    return (
      <div className="min-h-full px-4 pt-6 animate-fade-in">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{isPickMode ? 'Pick Exercise' : 'Exercises'}</h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {exercises?.length || 0} exercises across {MUSCLE_GROUPS.length} muscle groups
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPickMode && (
              <button
                onClick={() => navigate('/workout')}
                className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold transition-all active:scale-95"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-bold text-black transition-all active:scale-95"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Muscle Group Tiles */}
        <div className="grid grid-cols-2 gap-3">
          {MUSCLE_GROUPS.map((group, i) => {
            const Icon = MUSCLE_GROUP_ICONS[group] || Dumbbell;
            const color = MUSCLE_GROUP_COLORS[group];
            const count = groupCounts[group] || 0;
            const previewGif = groupPreviews[group];

            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-left transition-all duration-200 active:scale-[0.97] hover:border-opacity-60"
                style={{
                  animationDelay: `${i * 50}ms`,
                  borderColor: `${color}25`,
                }}
              >
                {/* Gradient overlay background */}
                <div
                  className="absolute inset-0 opacity-[0.07] transition-opacity group-hover:opacity-[0.12]"
                  style={{
                    background: `radial-gradient(circle at 70% 30%, ${color}, transparent 70%)`,
                  }}
                />

                {/* Preview GIF as subtle background */}
                {previewGif && (
                  <div className="absolute right-0 bottom-0 h-20 w-20 opacity-[0.08] group-hover:opacity-[0.14] transition-opacity">
                    <img
                      src={previewGif}
                      alt=""
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="relative z-10 p-4">
                  {/* Icon */}
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>

                  {/* Label */}
                  <h3 className="text-base font-bold">{MUSCLE_GROUP_LABELS[group]}</h3>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {count} {count === 1 ? 'exercise' : 'exercises'}
                  </p>
                </div>

                {/* Bottom accent line */}
                <div
                  className="h-0.5 w-full opacity-50 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: color }}
                />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pb-8 pt-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            Made with ❤️ by Niloy
          </p>
        </div>

        {/* Add Exercise Modal */}
        {showAdd && (
          <AddExerciseModal
            newName={newName}
            setNewName={setNewName}
            newGroup={newGroup}
            setNewGroup={setNewGroup}
            onAdd={handleAdd}
            onClose={() => { setShowAdd(false); setNewName(''); }}
          />
        )}
      </div>
    );
  }

  // ── EXERCISE GRID VIEW (within a muscle group) ──
  const Icon = MUSCLE_GROUP_ICONS[selectedGroup] || Dumbbell;
  const color = MUSCLE_GROUP_COLORS[selectedGroup];

  return (
    <div className="min-h-full animate-fade-in">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold truncate" style={{ color }}>
              {MUSCLE_GROUP_LABELS[selectedGroup]}
            </h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              {groupExercises.length} exercises
            </p>
          </div>
          <button
            onClick={() => { setNewGroup(selectedGroup); setShowAdd(true); }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search within group */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${MUSCLE_GROUP_LABELS[selectedGroup].toLowerCase()} exercises…`}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-2 pl-9 pr-8 text-sm focus:border-[var(--color-accent)]/50 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="px-3 py-4">
        {groupExercises.length === 0 ? (
          <div className="mt-12 text-center">
            <Dumbbell size={40} className="mx-auto mb-3 text-[var(--color-text-muted)]/30" />
            <p className="text-sm text-[var(--color-text-muted)]">
              {searchTerm ? 'No exercises match your search' : 'No exercises in this group'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {groupExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => {
                  if (isPickMode) {
                    sessionStorage.setItem('pickedExerciseId', ex.id);
                    navigate('/workout');
                  } else {
                    navigate(`/exercises/${ex.id}`);
                  }
                }}
                className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-left transition-all duration-150 active:scale-[0.97] hover:border-[var(--color-border-light)]"
              >
                {/* GIF area */}
                <LazyGif
                  src={ex.videoUrl}
                  alt={ex.name}
                  className="relative aspect-square w-full overflow-hidden bg-black/30"
                />

                {/* Name overlay */}
                <div className="p-2.5">
                  <p className="text-[11px] font-semibold leading-tight text-[var(--color-text-primary)] line-clamp-2">
                    {ex.name}
                  </p>
                </div>

                {/* Accent bottom line on hover */}
                <div
                  className="absolute bottom-0 left-0 h-0.5 w-full opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: color }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pb-8 pt-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          Made with ❤️ by Niloy
        </p>
      </div>

      {/* Add Exercise Modal */}
      {showAdd && (
        <AddExerciseModal
          newName={newName}
          setNewName={setNewName}
          newGroup={newGroup}
          setNewGroup={setNewGroup}
          onAdd={handleAdd}
          onClose={() => { setShowAdd(false); setNewName(''); }}
        />
      )}

      {/* Demo Modal */}
      {demoExercise && (
        <ExerciseDemoModal
          isOpen={!!demoExercise}
          onClose={() => setDemoExercise(null)}
          exercise={demoExercise}
        />
      )}
    </div>
  );
}

// ── Add Exercise Modal (extracted for reuse) ──
function AddExerciseModal({ newName, setNewName, newGroup, setNewGroup, onAdd, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-[var(--color-bg-secondary)] p-6 animate-scale-in">
        <h2 className="mb-4 text-lg font-bold">Add Custom Exercise</h2>

        <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
          Exercise Name
        </label>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Incline Cable Fly"
          className="mb-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-3 text-sm focus:border-[var(--color-accent)]/50 focus:outline-none"
          autoFocus
        />

        <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
          Muscle Group
        </label>
        <select
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
          className="mb-6 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-3 text-sm focus:border-[var(--color-accent)]/50 focus:outline-none"
        >
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>{MUSCLE_GROUP_LABELS[g]}</option>
          ))}
        </select>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--color-border)] py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={!newName.trim()}
            className="flex-1 rounded-xl bg-[var(--color-accent)] py-3 text-sm font-bold text-black transition-all active:scale-95 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
