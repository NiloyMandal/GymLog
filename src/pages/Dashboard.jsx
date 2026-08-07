import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db, MUSCLE_GROUP_COLORS } from '../db';
import { useSettings } from '../hooks/useSettings';
import { getLocalDateString } from '../utils/date';
import { Dumbbell, Flame, ChevronRight, Zap, Settings, ListChecks, Sun, Moon, Sunrise } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const routines = useLiveQuery(() => db.routines.toArray());
  const workoutLogs = useLiveQuery(() => db.workoutLogs.orderBy('date').reverse().toArray());

  const exercises = useLiveQuery(() => db.exercises.toArray());
  const exerciseMap = {};
  exercises?.forEach((ex) => { exerciseMap[ex.id] = ex; });

  const today = new Date();
  const todayStr = getLocalDateString(today);

  // Greeting
  const hour = today.getHours();
  const isMorning = hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const greeting = isMorning ? 'Good Morning' : isAfternoon ? 'Good Afternoon' : 'Good Evening';
  const GreetingIcon = isMorning ? Sunrise : isAfternoon ? Sun : Moon;
  const iconColor = isMorning ? 'text-amber-500' : isAfternoon ? 'text-orange-500' : 'text-indigo-400';

  // This week's sessions (Starting on Monday)
  const startOfWeek = new Date(today);
  const currentDay = today.getDay();
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return getLocalDateString(d);
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
        return getLocalDateString(d);
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

  // Next routine in rotation or by weekday match
  const todayWeekdayStr = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const routineForToday = routines?.find(r => r.name.toLowerCase().includes(todayWeekdayStr));
  
  const nextRoutineIdx = settings.lastRoutineIndex || 0;
  const fallbackRoutine = routines?.[nextRoutineIdx % (routines?.length || 1)];
  
  const nextRoutine = routineForToday || fallbackRoutine;

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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <GreetingIcon size={16} className={iconColor} />
            <p className="text-sm font-bold tracking-wide text-[var(--color-text-muted)]">{greeting}</p>
          </div>
          <h1 className="text-2xl font-black">
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
        className="relative mb-6 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-accent)] to-[#84cc16] p-[1px] transition-all active:scale-[0.98] animate-pulse-glow"
      >
        <div className="flex h-full w-full items-center justify-between rounded-[23px] bg-black/20 backdrop-blur-sm px-6 py-5">
          <div className="relative z-10 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/70">
              {nextRoutine ? 'Next Up' : 'Ready to go?'}
            </p>
            <h2 className="mt-1 text-2xl font-black text-black">
              {nextRoutine?.name || 'Start Workout'}
            </h2>
            {nextRoutine && (
              <p className="mt-1 text-xs font-bold text-black/60">
                {nextRoutine.exercises?.length || 0} exercises
              </p>
            )}
          </div>
          <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black/15 shadow-inner">
            <Dumbbell size={28} className="text-black" />
          </div>
        </div>
      </button>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {/* Streak Stat */}
        <div className="group rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 relative overflow-hidden">
          <div className="mb-2 flex items-center gap-2 relative z-10">
            <div className="relative">
              {streak > 0 && <div className="absolute inset-0 rounded-full bg-orange-500/40 blur-md"></div>}
              <Flame size={16} className="relative z-10 text-orange-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Streak
            </span>
          </div>
          <p className="mt-2 text-3xl font-black relative z-10">
            {streak}
            <span className="ml-1 text-sm font-bold text-[var(--color-text-muted)]">
              {streak === 1 ? 'wk' : 'wks'}
            </span>
          </p>
        </div>

        {/* This Week Progress Stat */}
        <div className="group rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 relative overflow-hidden">
          <div className="mb-2 flex items-center gap-2 relative z-10">
            <Zap size={16} className="text-[var(--color-accent)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              This Week
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between relative z-10">
            <p className="text-3xl font-black">
              {weekSessions}
              <span className="ml-1 text-sm font-bold text-[var(--color-text-muted)]">/{routineCount}</span>
            </p>
            
            <div className="relative flex h-10 w-10 items-center justify-center shrink-0">
              <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
                <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                <circle
                  cx="20" cy="20" r="16" fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 16}
                  strokeDashoffset={2 * Math.PI * 16 * (1 - Math.min(1, weekSessions / routineCount))}
                  className="transition-[stroke-dashoffset] duration-1000 ease-out"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Week dot grid */}
      <div className="mb-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          This Week
        </p>
        <div className="flex justify-between gap-1">
          {weekDays.map((dateStr, i) => {
            const dateObj = new Date(dateStr);
            const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
            const hasWorkout = workoutDates.has(dateStr);
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className={`relative flex w-full max-w-[36px] flex-col items-center justify-center gap-1.5 rounded-full py-2.5 transition-all ${
                  hasWorkout
                    ? 'bg-[var(--color-accent)] text-black shadow-[0_4px_12px_rgba(163,230,53,0.25)]'
                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
                }`}
              >
                {isToday && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
                )}
                <span className={`text-[10px] font-bold ${hasWorkout ? 'text-black/60' : isToday ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)] opacity-70'}`}>
                  {dayLabel}
                </span>
                <span className={`text-sm font-black ${isToday && !hasWorkout ? 'text-[var(--color-accent)]' : ''}`}>
                  {dateObj.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          Recent Workouts
        </h2>
        {recentLogs.length === 0 ? (
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">No workouts yet. Start your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => {
              const totalSets = log.exercises?.reduce(
                (sum, ex) => sum + (ex.sets?.filter((s) => s.completed).length || 0), 0
              ) || 0;
              
              const muscleGroups = Array.from(
                new Set(log.exercises?.map(e => exerciseMap[e.exerciseId]?.muscleGroup).filter(Boolean))
              ).slice(0, 5);

              return (
                <div
                  key={log.id}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-4 transition-all hover:bg-[var(--color-bg-elevated)] active:scale-[0.98]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">
                      {new Date(log.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs font-medium text-[var(--color-text-muted)] truncate">
                        {log.exercises?.length || 0} exercises · {totalSets} sets
                      </p>
                      {muscleGroups.length > 0 && (
                        <div className="flex -space-x-1">
                          {muscleGroups.map((mg, idx) => (
                            <div 
                              key={idx} 
                              className="h-2 w-2 rounded-full border border-[var(--color-bg-card)] group-hover:border-[var(--color-bg-elevated)] transition-colors" 
                              style={{ backgroundColor: MUSCLE_GROUP_COLORS[mg] || '#666' }} 
                              title={mg}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pb-8 pt-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          Made with ❤️ by Niloy
        </p>
      </div>
    </div>
  );
}
