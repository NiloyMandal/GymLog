import { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS } from '../db';
import { useSettings } from '../hooks/useSettings';
import { getAllPRs, getExerciseHistory } from '../utils/pr';
import { Trophy, TrendingUp, Calendar, Weight, Scale, Target, ArrowLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { displayWeight, inputToKg, formatWeight } from '../utils/units';
import { getLocalDateString } from '../utils/date';

// Simple lazy image component for GIFs
function LazyImg({ src, alt, className }) {
  const imgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

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
      { rootMargin: '100px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isVisible ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-full w-full bg-[var(--color-bg-elevated)]" />
      )}
    </div>
  );
}

// Simple calendar heatmap component
function CalendarHeatmap({ workoutDates }) {
  const today = new Date();
  const weeks = 52;
  const days = [];

  // Go back (weeks - 1) from the start of the current week (Monday)
  const startDate = new Date(today);
  const currentDay = today.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  startDate.setDate(today.getDate() + diffToMonday);
  startDate.setDate(startDate.getDate() - (weeks - 1) * 7);
  startDate.setHours(0, 0, 0, 0);

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      if (date > today) continue;
      const dateStr = getLocalDateString(date);
      days.push({
        date: dateStr,
        hasWorkout: workoutDates.has(dateStr),
        weekIdx: w,
        dayIdx: d,
      });
    }
  }

  const months = [];
  let lastMonth = -1;
  days.forEach((day) => {
    const month = new Date(day.date).getMonth();
    if (month !== lastMonth && day.dayIdx === 0) {
      months.push({
        label: new Date(day.date).toLocaleDateString('en', { month: 'short' }),
        weekIdx: day.weekIdx,
      });
      lastMonth = month;
    }
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Month labels */}
        <div className="flex mb-1 ml-6">
          {months.map((m, i) => (
            <div
              key={i}
              className="text-[9px] text-[var(--color-text-muted)]"
              style={{ position: 'relative', left: `${m.weekIdx * 14}px` }}
            >
              {m.label}
            </div>
          ))}
        </div>

        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] mr-1 pt-0">
            {['M', '', 'W', '', 'F', '', 'S'].map((label, i) => (
              <div key={i} className="h-[11px] w-4 text-[8px] text-[var(--color-text-muted)] leading-[11px]">
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2px]">
            {Array.from({ length: weeks }, (_, w) => (
              <div key={w} className="flex flex-col gap-[2px]">
                {Array.from({ length: 7 }, (_, d) => {
                  const day = days.find((dd) => dd.weekIdx === w && dd.dayIdx === d);
                  if (!day) return <div key={d} className="h-[11px] w-[11px]" />;
                  return (
                    <div
                      key={d}
                      className={`h-[12px] w-[12px] rounded-[3px] transition-colors ${
                        day.hasWorkout
                          ? 'bg-[var(--color-accent)] shadow-[0_0_8px_rgba(163,230,53,0.3)]'
                          : 'bg-[var(--color-bg-elevated)]'
                      }`}
                      title={`${day.date}${day.hasWorkout ? ' ✓' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Progress() {
  const { settings } = useSettings();
  const workoutLogs = useLiveQuery(() => db.workoutLogs.toArray());
  const exercises = useLiveQuery(() => db.exercises.toArray());
  const bodyMetrics = useLiveQuery(() => db.bodyMetrics.orderBy('date').toArray());

  const [prs, setPrs] = useState({});
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [showBodyweightForm, setShowBodyweightForm] = useState(false);
  const [bwInput, setBwInput] = useState('');
  const [activeTab, setActiveTab] = useState('heatmap');

  useEffect(() => {
    getAllPRs().then(setPrs);
  }, [workoutLogs]);

  useEffect(() => {
    if (selectedExerciseId) {
      getExerciseHistory(selectedExerciseId).then(setExerciseHistory);
    }
  }, [selectedExerciseId, workoutLogs]);

  const workoutDates = useMemo(() => {
    return new Set(workoutLogs?.map((l) => l.date) || []);
  }, [workoutLogs]);

  const performedExerciseIds = useMemo(() => {
    if (!workoutLogs) return new Set();
    const ids = new Set();
    workoutLogs.forEach(log => {
      log.exercises?.forEach(ex => ids.add(ex.exerciseId));
    });
    return ids;
  }, [workoutLogs]);

  const performedExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(ex => performedExerciseIds.has(ex.id));
  }, [exercises, performedExerciseIds]);

  const exerciseMap = {};
  exercises?.forEach((ex) => { exerciseMap[ex.id] = ex; });

  const [chartMetric, setChartMetric] = useState('weight');

  const chartData = exerciseHistory.map((h) => {
    let maxE1RM = 0;
    let maxWeight = 0;
    let totalVolume = 0;

    h.sets.forEach(s => {
      if (s.completed !== false) {
        const e1rm = s.weight * (1 + s.reps / 30);
        if (e1rm > maxE1RM) maxE1RM = e1rm;
        if (s.weight > maxWeight) maxWeight = s.weight;
        totalVolume += s.weight * s.reps;
      }
    });

    return {
      date: new Date(h.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      weight: displayWeight(maxWeight, settings.unit),
      e1rm: displayWeight(maxE1RM, settings.unit),
      volume: displayWeight(totalVolume, settings.unit),
    };
  });

  const tabs = [
    { id: 'heatmap', label: 'Activity' },
    { id: 'exercises', label: 'Exercises' },
    { id: 'prs', label: 'PRs' },
  ];

  return (
    <div className="min-h-full px-4 pt-6 animate-fade-in">
      <h1 className="mb-5 text-2xl font-bold">Progress</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-1.5 rounded-2xl bg-[var(--color-bg-secondary)] p-1.5 shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-0 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest truncate transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-[var(--color-bg-card)] text-[var(--color-accent)] shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Heatmap Tab */}
      {activeTab === 'heatmap' && (
        <div className="animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[var(--color-accent)]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] truncate">
                Activity Heatmap
              </h2>
            </div>
            <div className="text-right leading-none">
              <span className="text-xl font-black text-[var(--color-text-primary)]">{workoutDates.size}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] ml-1">total</span>
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <CalendarHeatmap workoutDates={workoutDates} />
          </div>
        </div>
      )}

      {/* Exercises Tab */}
      {activeTab === 'exercises' && (
        <div className="animate-fade-in">
          {!selectedExerciseId ? (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Your Exercises
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Select an exercise you've performed to see progression.
                </p>
              </div>

              {performedExercises.length === 0 ? (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
                  <p className="text-sm text-[var(--color-text-muted)]">No exercises performed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {performedExercises.map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => setSelectedExerciseId(ex.id)}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-left transition-all hover:border-[var(--color-accent)]/50 active:scale-95"
                    >
                      <div className="aspect-square w-full bg-white relative">
                        <LazyImg
                          src={ex.videoUrl}
                          alt={ex.name}
                          className="h-full w-full mix-blend-multiply"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold leading-tight line-clamp-2">
                          {ex.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedExerciseId(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black truncate">{exerciseMap[selectedExerciseId]?.name}</h2>
                </div>
              </div>

              {chartData.length > 1 ? (
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-[var(--color-bg-secondary)] p-2 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Max Wt</p>
                      <p className="text-sm font-black text-[var(--color-text-primary)]">
                        {formatWeight(Math.max(...chartData.map(d => parseFloat(d.weight) || 0)), settings.unit)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[var(--color-bg-secondary)] p-2 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Best e1RM</p>
                      <p className="text-sm font-black text-[var(--color-text-primary)]">
                        {formatWeight(Math.max(...chartData.map(d => parseFloat(d.e1rm) || 0)), settings.unit)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[var(--color-bg-secondary)] p-2 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Peak Vol</p>
                      <p className="text-sm font-black text-[var(--color-text-primary)]">
                        {formatWeight(Math.max(...chartData.map(d => parseFloat(d.volume) || 0)), settings.unit)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Progression
                    </h3>
                    <div className="flex rounded-lg bg-[var(--color-bg-secondary)] p-0.5">
                      {['weight', 'e1rm', 'volume'].map((metric) => (
                        <button
                          key={metric}
                          onClick={() => setChartMetric(metric)}
                          className={`rounded-md px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${
                            chartMetric === metric
                              ? 'bg-[var(--color-accent)] text-black shadow-sm'
                              : 'text-[var(--color-text-muted)]'
                          }`}
                        >
                          {metric === 'weight' ? 'Max Wt' : metric === 'e1rm' ? 'e1RM' : 'Vol'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                        tickLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                        tickLine={false}
                        width={35}
                        tickMargin={8}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '16px',
                          color: 'var(--color-text-primary)',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={chartMetric}
                        stroke="#a3e635"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorMetric)"
                        activeDot={{ r: 6, fill: '#a3e635', stroke: 'var(--color-bg-primary)', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

              ) : (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Not enough data yet. Log at least 2 sessions to see a chart.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PRs Tab */}
      {activeTab === 'prs' && (
        <div className="animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Personal Records
            </h2>
          </div>

          {Object.keys(prs).length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No PRs yet. Start logging workouts!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                Object.entries(prs).reduce((acc, [exId, pr]) => {
                  const ex = exerciseMap[exId];
                  if (!ex) return acc;
                  const group = ex.muscleGroup || 'other';
                  if (!acc[group]) acc[group] = [];
                  acc[group].push({ ...pr, ex });
                  return acc;
                }, {})
              ).map(([muscleGroup, groupPrs]) => (
                <div key={muscleGroup}>
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MUSCLE_GROUP_COLORS[muscleGroup] }} />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      {MUSCLE_GROUP_LABELS[muscleGroup] || 'Other'}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {groupPrs.map((pr) => (
                      <div
                        key={pr.ex.id}
                        className="group relative flex items-center justify-between gap-2 overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-[var(--color-bg-card)] to-yellow-500/5 px-4 py-4 transition-all"
                      >
                        <div className="relative z-10 min-w-0 flex-1">
                          <p className="text-sm font-black text-[var(--color-text-primary)] truncate">{pr.ex.name}</p>
                          <p className="mt-0.5 text-xs font-bold text-yellow-600/70">
                            {pr.date ? new Date(pr.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </p>
                        </div>
                        <div className="relative z-10 shrink-0 text-right">
                          <p className="text-xl font-black text-yellow-500 drop-shadow-sm">
                            {formatWeight(pr.weight, settings.unit)}<span className="text-xs font-bold text-yellow-500/70 ml-0.5">{settings.unit}</span>
                          </p>
                          <p className="text-xs font-black text-[var(--color-text-muted)]">×{pr.reps}</p>
                        </div>
                        <div className="absolute -right-4 -top-4 opacity-[0.08] blur-md pointer-events-none">
                          <Trophy size={80} className="text-yellow-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
