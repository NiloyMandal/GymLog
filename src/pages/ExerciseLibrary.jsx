import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db, MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS, MUSCLE_GROUPS } from '../db';
import { Search, Plus, X, ChevronRight } from 'lucide-react';

export default function ExerciseLibrary() {
  const exercises = useLiveQuery(() => db.exercises.toArray());
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('chest');
  const navigate = useNavigate();

  const filtered = exercises?.filter((ex) =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const grouped = MUSCLE_GROUPS.reduce((acc, group) => {
    const items = filtered.filter((ex) => ex.muscleGroup === group);
    if (items.length > 0) acc[group] = items;
    return acc;
  }, {});

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await db.exercises.add({
      name: newName.trim(),
      muscleGroup: newGroup,
      defaultUnit: 'kg',
    });
    setNewName('');
    setShowAdd(false);
  };

  return (
    <div className="min-h-full px-4 pt-6 animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exercises</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-bold text-black transition-all active:scale-95"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search exercises..."
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-3 pl-10 pr-4 text-sm focus:border-[var(--color-accent)]/50 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Grouped list */}
      {Object.entries(grouped).map(([group, exs]) => (
        <div key={group} className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: MUSCLE_GROUP_COLORS[group] }}
            />
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: MUSCLE_GROUP_COLORS[group] }}
            >
              {MUSCLE_GROUP_LABELS[group]}
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">({exs.length})</span>
          </div>

          <div className="space-y-1">
            {exs.map((ex) => (
              <button
                key={ex.id}
                onClick={() => navigate(`/exercises/${ex.id}`)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-[var(--color-bg-card)] active:bg-[var(--color-bg-card)]"
              >
                <span className="font-medium">{ex.name}</span>
                <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-[var(--color-text-muted)]">No exercises found</p>
        </div>
      )}

      {/* Add Exercise Modal */}
      {showAdd && (
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
                onClick={() => { setShowAdd(false); setNewName(''); }}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="flex-1 rounded-xl bg-[var(--color-accent)] py-3 text-sm font-bold text-black transition-all active:scale-95 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
