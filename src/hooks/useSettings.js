import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

const DEFAULTS = {
  unit: 'kg',
  restTimerSeconds: 90,
  lastRoutineIndex: 0,
};

export function useSettings() {
  const settings = useLiveQuery(() => db.settings.toArray());

  const map = {};
  if (settings) {
    settings.forEach((s) => {
      map[s.key] = s.value;
    });
  }

  // Merge defaults
  const resolved = { ...DEFAULTS, ...map };

  const setSetting = async (key, value) => {
    await db.settings.put({ key, value });
  };

  return { settings: resolved, setSetting, loading: !settings };
}
