import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { useSettings } from '../hooks/useSettings';
import { Dumbbell, Flame, ChevronRight, Zap, Settings, ListChecks } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const routines = useLiveQuery(() => db.routines.toArray());
  const workoutLogs = useLiveQuery(() => db.workoutLogs.orderBy('date').reverse().toArray());

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Greeting
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // This week's sessions
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const workoutDates = new Set(workoutLogs?.map((l) => l.date) || []);
  const weekSessions = weekDays.filter((d) => workoutDates.has(d)).length;

  // ── Streak: based on routine schedule (sessions per week), not raw daily ──
  // Count weeks where the user completed at least as many sessions as
  // their number of routines (i.e. completed a full rotation).
  // Fallback: if no routines, treat any session that week as a "hit".
  const routineCount = routines?.length || 3;
  let streak = 0;
  if (workoutLogs && workoutLogs.length > 0) {
    // Walk backwards week by week from the current week
    let weekStart = new Date(startOfWeek);
    // Allow current week to be incomplete — start checking from last week
    // unless the current week already has enough sessions
    const currentWeekHits = weekDays.filter((d) => workoutDates.has(d)).length;
    if (currentWeekHits >= routineCount) {
      streak = 1;
      weekStart.setDate(weekStart.getDate() - 7);
    }

    for (let i = 0; i < 52; i++) {
      const wDays = Array.from({ length: 7 }, (_, j) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + j);
        return d.toISOString().split('T')[0];
      });
      const hits = wDays.filter((d) => workoutDates.has(d)).length;
      if (hits >= routineCount) {
        streak++;
        weekStart.setDate(weekStart.getDate() - 7);
      } else {
        break;
      }
    }
  }

  // Next routine in rotation
  const nextRoutineIdx = settings.lastRoutineIndex || 0;
  const nextRoutine = routines?.[nextRoutineIdx % (routines?.length || 1)];

  // Recent workouts
  const recentLogs = workoutLogs?.slice(0, 5) || [];

  const formatDuration = (start, end) => {
    if (!start || !end) return '--';
    const mins = Math.round((end - start) / 60000);
    return `${mins}m`;
  };

  return (
    <div className="min-h-full px-4 pt-6 pb-4 animate-fade-in">
      {/* Header with Routines + Settings shortcuts */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{greeting}</p>
          <h1 className="text-2xl font-bold">
            {today.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/routines')}
            className="rounded-xl p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]"
            aria-label="Routines"
          >
            <ListChecks size={20} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="rounded-xl p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Start Workout CTA */}
      <button
        onClick={() => navigate('/workout')}
        className="mb-6 w-full rounded-2xl bg-gradient-to-r from-[var(--color-accent)] to-[#84cc16] p-5 text-left transition-all active:scale-[0.98] animate-pulse-glow"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-black/60">
              {nextRoutine ? 'Next Up' : 'Ready to go?'}
            </p>
            <h2 className="mt-1 text-xl font-black text-black">
              {nextRoutine?.name || 'Start Workout'}
            </h2>
            {nextRoutine && (
              <p className="mt-1 text-xs text-black/60">
                {nextRoutine.exercises?.length || 0} exercises
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/10">
            <Dumbbell size={24} className="text-black" />
          </div>
        </div>
      </button>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Streak
            </span>
          </div>
          <p className="text-3xl font-black">
            {streak}
            <span className="ml-1 text-sm font-medium text-[var(--color-text-muted)]">
              {streak === 1 ? 'week' : 'weeks'}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Zap size={16} className="text-[var(--color-accent)]" />
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              This Week
            </span>
          </div>
          <p className="text-3xl font-black">
            {weekSessions}
            <span className="ml-1 text-sm font-medium text-[var(--color-text-muted)]">/{routineCount}</span>
          </p>
        </div>
      </div>

      {/* Week dot grid */}
      <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          This Week
        </p>
        <div className="flex justify-between">
          {weekDays.map((dateStr, i) => {
            const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i];
            const hasWorkout = workoutDates.has(dateStr);
            const isToday = dateStr === todayStr;

            return (
              <div key={dateStr} className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
                  {dayLabel}
                </span>
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    hasWorkout
                      ? 'bg-[var(--color-accent)] text-black'
                      : isToday
                        ? 'border-2 border-[var(--color-accent)]/40 text-[var(--color-text-secondary)]'
                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {new Date(dateStr).getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Workouts */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          Recent Workouts
        </h2>
        {recentLogs.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">No workouts yet. Start your first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const totalSets = log.exercises?.reduce(
                (sum, ex) => sum + (ex.sets?.filter((s) => s.completed).length || 0), 0
              ) || 0;

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold">
                      {new Date(log.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {log.exercises?.length || 0} exercises · {totalSets} sets · {formatDuration(log.startTime, log.endTime)}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
