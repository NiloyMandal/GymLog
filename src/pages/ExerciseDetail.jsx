import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState, useEffect } from 'react';
import { db, MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS } from '../db';
import { useSettings } from '../hooks/useSettings';
import { getExerciseHistory, getExercisePR } from '../utils/pr';
import { ArrowLeft, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { displayWeight, formatWeight } from '../utils/units';

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const exercise = useLiveQuery(() => db.exercises.get(id), [id]);
  const [history, setHistory] = useState([]);
  const [pr, setPr] = useState(null);

  useEffect(() => {
    if (!id) return;
    getExerciseHistory(id).then(setHistory);
    getExercisePR(id).then(setPr);
  }, [id]);

  const [chartMetric, setChartMetric] = useState('weight');

  if (!exercise) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Loading...</p>
      </div>
    );
  }

  const chartData = history.map((h) => {
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

  return (
    <div className="min-h-full px-4 pt-4 animate-fade-in">
      {/* Header */}
      <button
        onClick={() => navigate('/exercises')}
        className="mb-4 flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{exercise.name}</h1>
        </div>
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase"
          style={{
            backgroundColor: MUSCLE_GROUP_COLORS[exercise.muscleGroup] + '20',
            color: MUSCLE_GROUP_COLORS[exercise.muscleGroup],
          }}
        >
          {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
        </span>
      </div>

      {/* PR Card */}
      {pr && (
        <div className="mb-6 rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-[var(--color-accent)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Personal Record
            </span>
          </div>
          <p className="text-3xl font-black">
            {formatWeight(pr.weight, settings.unit)} <span className="text-lg font-medium text-[var(--color-text-secondary)]">{settings.unit}</span>
            <span className="mx-2 text-lg text-[var(--color-text-muted)]">×</span>
            {pr.reps} <span className="text-lg font-medium text-[var(--color-text-secondary)]">reps</span>
          </p>
          {pr.date && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Set on {new Date(pr.date).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* Weight Progress Chart */}
      {chartData.length > 1 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--color-accent)]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Progression
              </h2>
            </div>
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
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <ResponsiveContainer width="100%" height={200}>
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
                  activeDot={{ r: 6, fill: '#a3e635' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-[var(--color-text-muted)]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Session History
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">No history yet. Start a workout to log sets!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...history].reverse().slice(0, 20).map((session, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3"
              >
                <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
                  {new Date(session.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {session.sets.map((set, j) => (
                    <span
                      key={j}
                      className="rounded-lg bg-[var(--color-bg-elevated)] px-2.5 py-1 text-xs font-medium"
                    >
                      {formatWeight(set.weight, settings.unit)}{settings.unit} × {set.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
