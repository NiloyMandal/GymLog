import { useState } from 'react';
import { db } from '../db';
import { useSettings } from '../hooks/useSettings';
import {
  Scale, Timer, Download, Upload, Trash2, AlertTriangle, Check, Activity, Dumbbell
} from 'lucide-react';

export default function Settings() {
  const { settings, setSetting } = useSettings();
  const [showReset, setShowReset] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // null | 'success' | 'error'

  const handleExport = async () => {
    const data = {
      exercises: await db.exercises.toArray(),
      routines: await db.routines.toArray(),
      workoutLogs: await db.workoutLogs.toArray(),
      bodyMetrics: await db.bodyMetrics.toArray(),
      settings: await db.settings.toArray(),
      exportDate: new Date().toISOString(),
      version: 1,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymlog-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Save last backup date
    setSetting('lastBackupDate', new Date().toISOString());
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate structure
        if (!data.exercises || !data.routines) {
          throw new Error('Invalid backup file');
        }

        // Clear existing data
        await db.exercises.clear();
        await db.routines.clear();
        await db.workoutLogs.clear();
        await db.bodyMetrics.clear();
        await db.settings.clear();

        // Import
        if (data.exercises.length) await db.exercises.bulkAdd(data.exercises);
        if (data.routines.length) await db.routines.bulkAdd(data.routines);
        if (data.workoutLogs?.length) await db.workoutLogs.bulkAdd(data.workoutLogs);
        if (data.bodyMetrics?.length) await db.bodyMetrics.bulkAdd(data.bodyMetrics);
        if (data.settings?.length) await db.settings.bulkAdd(data.settings);

        setImportStatus('success');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err) {
        console.error('Import failed:', err);
        setImportStatus('error');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    input.click();
  };

  const handleReset = async () => {
    await db.exercises.clear();
    await db.routines.clear();
    await db.workoutLogs.clear();
    await db.bodyMetrics.clear();
    await db.settings.clear();

    // Re-seed
    const { seedDatabase } = await import('../db');
    await seedDatabase();

    setShowReset(false);
    window.location.reload();
  };

  const restTimerOptions = [30, 45, 60, 90, 120, 150, 180, 240, 300];

  // Backup nudge logic
  const lastBackup = settings.lastBackupDate ? new Date(settings.lastBackupDate) : null;
  const daysSinceBackup = lastBackup ? Math.floor((Date.now() - lastBackup) / (1000 * 60 * 60 * 24)) : Infinity;
  const needsBackup = daysSinceBackup > 7;

  return (
    <div className="min-h-full px-4 pt-6 animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      {/* Unit Toggle */}
      <div className="mb-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)]/10">
              <Scale size={18} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-sm font-bold">Weight Unit</p>
              <p className="text-xs text-[var(--color-text-muted)]">Used across the app</p>
            </div>
          </div>
          <div className="flex rounded-lg bg-[var(--color-bg-elevated)] p-0.5">
            <button
              onClick={() => setSetting('unit', 'kg')}
              className={`rounded-md px-4 py-2 text-xs font-bold transition-all ${
                settings.unit === 'kg'
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              kg
            </button>
            <button
              onClick={() => setSetting('unit', 'lb')}
              className={`rounded-md px-4 py-2 text-xs font-bold transition-all ${
                settings.unit === 'lb'
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              lb
            </button>
          </div>
        </div>
      </div>

      {/* Rest Timer */}
      <div className="mb-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
            <Timer size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold">Rest Timer</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Default: {Math.floor(settings.restTimerSeconds / 60)}:{(settings.restTimerSeconds % 60).toString().padStart(2, '0')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {restTimerOptions.map((secs) => (
            <button
              key={secs}
              onClick={() => setSetting('restTimerSeconds', secs)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                settings.restTimerSeconds === secs
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              {secs >= 60 ? `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}` : `${secs}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Preferences Group */}
      <div className="mb-3 space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        {/* Track RPE Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
              <Activity size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold">Track RPE / RIR</p>
              <p className="text-xs text-[var(--color-text-muted)]">Rate of Perceived Exertion</p>
            </div>
          </div>
          <button
            onClick={() => setSetting('trackRPE', !settings.trackRPE)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.trackRPE ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bg-elevated)]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-[var(--color-bg-primary)] transition-transform ${
                settings.trackRPE ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="h-px w-full bg-[var(--color-border)]/50" />

        {/* Bar Weight */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
              <Dumbbell size={18} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-bold">Bar Weight</p>
              <p className="text-xs text-[var(--color-text-muted)]">For Plate Calculator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={settings.barWeight || (settings.unit === 'kg' ? 20 : 45)}
              onChange={(e) => setSetting('barWeight', Number(e.target.value))}
              className="w-14 rounded-lg bg-[var(--color-bg-elevated)] px-2 py-1.5 text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-xs text-[var(--color-text-muted)]">{settings.unit}</span>
          </div>
        </div>
      </div>

      {/* Export */}
      <button
        onClick={handleExport}
        className="mb-3 flex w-full flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-left transition-all active:scale-[0.99]"
      >
        <div className="flex w-full items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10">
            <Download size={18} className="text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Backup & Export Data</p>
            <p className="text-xs text-[var(--color-text-muted)]">Download all data as JSON</p>
          </div>
          {needsBackup && (
            <div className="flex items-center gap-1 text-[var(--color-warning)]">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Backup Recommended</span>
            </div>
          )}
        </div>
        {lastBackup && (
          <p className="ml-12 text-xs text-[var(--color-text-muted)]">
            Last backup: {lastBackup.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </button>

      {/* Import */}
      <button
        onClick={handleImport}
        className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-left transition-all active:scale-[0.99]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
          <Upload size={18} className="text-purple-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Import Data</p>
          <p className="text-xs text-[var(--color-text-muted)]">Restore from JSON backup</p>
        </div>
        {importStatus === 'success' && (
          <Check size={18} className="text-[var(--color-success)]" />
        )}
      </button>

      {importStatus === 'success' && (
        <p className="mb-3 text-center text-xs text-[var(--color-success)]">Data imported successfully!</p>
      )}
      {importStatus === 'error' && (
        <p className="mb-3 text-center text-xs text-[var(--color-danger)]">Import failed. Check file format.</p>
      )}

      {/* Reset */}
      <button
        onClick={() => setShowReset(true)}
        className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-bg-card)] p-4 text-left transition-all active:scale-[0.99]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-danger)]/10">
          <Trash2 size={18} className="text-[var(--color-danger)]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--color-danger)]">Reset All Data</p>
          <p className="text-xs text-[var(--color-text-muted)]">Clear everything and re-seed defaults</p>
        </div>
      </button>

      {/* Version */}
      <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
        GymLog v1.0.0 · Data stored locally on your device
      </p>

      {/* Reset Confirmation */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-[var(--color-bg-secondary)] p-6 animate-scale-in">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle size={24} className="text-[var(--color-danger)]" />
              <h2 className="text-lg font-bold">Reset All Data?</h2>
            </div>
            <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
              This will permanently delete all your workouts, exercises, routines, and body metrics. Default seed data will be restored.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 rounded-xl bg-[var(--color-danger)] py-3 text-sm font-bold text-white transition-all active:scale-95"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
