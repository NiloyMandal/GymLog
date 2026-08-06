import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS } from '../db';
import { useSettings } from '../hooks/useSettings';
import { getAllPRs, getExerciseHistory } from '../utils/pr';
import { Trophy, TrendingUp, Calendar, Weight, Scale } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { displayWeight, inputToKg, formatWeight } from '../utils/units';

// Simple calendar heatmap component
function CalendarHeatmap({ workoutDates }) {
  const today = new Date();
  const weeks = 52;
  const days = [];

  // Go back 52 weeks from today
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks * 7) + (7 - startDate.getDay()));

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      if (date > today) continue;
      const dateStr = date.toISOString().split('T')[0];
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
            {['', 'M', '', 'W', '', 'F', ''].map((label, i) => (
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
                      className={`h-[11px] w-[11px] rounded-[2px] transition-colors ${
                        day.hasWorkout
                          ? 'bg-[var(--color-accent)]'
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

  const bodyweightData = bodyMetrics?.map((m) => ({
    date: new Date(m.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    weight: displayWeight(m.bodyweight, settings.unit),
  })) || [];

  const handleAddBodyweight = async () => {
    const weight = parseFloat(bwInput);
    if (isNaN(weight) || weight <= 0) return;
    const kgWeight = inputToKg(weight, settings.unit);
    const today = new Date().toISOString().split('T')[0];
    await db.bodyMetrics.add({ id: crypto.randomUUID(), date: today, bodyweight: kgWeight });
    setBwInput('');
    setShowBodyweightForm(false);
  };

  const tabs = [
    { id: 'heatmap', label: 'Activity' },
    { id: 'exercises', label: 'Exercises' },
    { id: 'prs', label: 'PRs' },
    { id: 'bodyweight', label: 'Body' },
  ];

  return (
    <div className="min-h-full px-4 pt-6 animate-fade-in">
      <h1 className="mb-5 text-2xl font-bold">Progress</h1>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl bg-[var(--color-bg-secondary)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Heatmap Tab */}
      {activeTab === 'heatmap' && (
        <div className="animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Workout Activity — Last 52 Weeks
            </h2>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <CalendarHeatmap workoutDates={workoutDates} />
          </div>
          <p className="mt-3 text-center text-xs text-[var(--color-text-muted)]">
            {workoutDates.size} total workouts logged
          </p>
        </div>
      )}

      {/* Exercises Tab */}
      {activeTab === 'exercises' && (
        <div className="animate-fade-in">
          <div className="mb-4">
            <select
              value={selectedExerciseId || ''}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm focus:border-[var(--color-accent)]/50 focus:outline-none"
            >
              <option value="">Select an exercise...</option>
              {exercises?.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          {selectedExerciseId && chartData.length > 1 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Progression
                </h3>
                <div className="flex rounded-lg bg-[var(--color-bg-elevated)] p-0.5">
                  {['weight', 'e1rm', 'volume'].map((metric) => (
                    <button
                      key={metric}
                      onClick={() => setChartMetric(metric)}
                      className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase transition-all ${
                        chartMetric === metric
                          ? 'bg-[var(--color-accent)] text-black'
                          : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      {metric === 'weight' ? 'Max Wt' : metric === 'e1rm' ? 'e1RM' : 'Vol'}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={chartMetric}
                    stroke="#a3e635"
                    strokeWidth={2}
                    dot={{ fill: '#a3e635', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {selectedExerciseId && chartData.length <= 1 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                Not enough data yet. Log at least 2 sessions to see a chart.
              </p>
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
            <div className="space-y-2">
              {Object.entries(prs).map(([exId, pr]) => {
                const ex = exerciseMap[exId];
                if (!ex) return null;
                return (
                  <div
                    key={exId}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: MUSCLE_GROUP_COLORS[ex.muscleGroup] }}
                      />
                      <div>
                        <p className="text-sm font-medium">{ex.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {pr.date ? new Date(pr.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-[var(--color-accent)]">
                        {formatWeight(pr.weight, settings.unit)}<span className="text-xs font-medium text-[var(--color-text-muted)]">{settings.unit}</span>
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">×{pr.reps}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bodyweight Tab */}
      {activeTab === 'bodyweight' && (
        <div className="animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-[var(--color-accent)]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Bodyweight Trend
              </h2>
            </div>
            <button
              onClick={() => setShowBodyweightForm(!showBodyweightForm)}
              className="flex items-center gap-1 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-black transition-all active:scale-95"
            >
              <Plus size={12} /> Log
            </button>
          </div>

          {showBodyweightForm && (
            <div className="mb-4 flex gap-2 animate-fade-in">
              <input
                type="number"
                value={bwInput}
                onChange={(e) => setBwInput(e.target.value)}
                placeholder={`Weight (${settings.unit})`}
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm focus:border-[var(--color-accent)]/50 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                autoFocus
              />
              <button
                onClick={handleAddBodyweight}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-bold text-black transition-all active:scale-95"
              >
                Save
              </button>
            </div>
          )}

          {bodyweightData.length > 1 ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={bodyweightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                    tickLine={false}
                    width={40}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                {bodyweightData.length === 1
                  ? 'Log one more entry to see your trend chart.'
                  : 'No bodyweight data yet. Start tracking!'}
              </p>
            </div>
          )}

          {bodyMetrics && bodyMetrics.length > 0 && (
            <div className="mt-4 space-y-1">
              {[...bodyMetrics].reverse().slice(0, 10).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-[var(--color-text-muted)]">
                    {new Date(m.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="font-bold">
                    {formatWeight(m.bodyweight, settings.unit)} <span className="text-xs text-[var(--color-text-muted)]">{settings.unit}</span>
                  </span>
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
