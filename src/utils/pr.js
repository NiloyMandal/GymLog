import { db } from '../db';

/**
 * Get the personal record (best weight for any rep count) for a given exercise.
 * Returns { weight, reps, date } or null.
 */
export async function getExercisePR(exerciseId) {
  const logs = await db.workoutLogs.toArray();
  let bestWeight = 0;
  let bestReps = 0;
  let bestDate = null;

  for (const log of logs) {
    if (!log.exercises) continue;
    for (const ex of log.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      if (!ex.sets) continue;
      for (const set of ex.sets) {
        if (set.completed && !set.isWarmup && set.weight > bestWeight) {
          bestWeight = set.weight;
          bestReps = set.reps;
          bestDate = log.date;
        } else if (set.completed && !set.isWarmup && set.weight === bestWeight && set.reps > bestReps) {
          bestReps = set.reps;
          bestDate = log.date;
        }
      }
    }
  }

  return bestWeight > 0 ? { weight: bestWeight, reps: bestReps, date: bestDate } : null;
}

/**
 * Check if a given set is a new PR for the exercise.
 * Compares against all historical data BEFORE the current workout.
 */
export async function isNewPR(exerciseId, weight, reps, excludeLogId) {
  const logs = await db.workoutLogs.toArray();
  let bestWeight = 0;

  for (const log of logs) {
    if (log.id === excludeLogId) continue;
    if (!log.exercises) continue;
    for (const ex of log.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      if (!ex.sets) continue;
      for (const set of ex.sets) {
        if (set.completed && !set.isWarmup && set.weight > bestWeight) {
          bestWeight = set.weight;
        }
      }
    }
  }

  return weight > bestWeight && weight > 0;
}

/**
 * Get all PRs across all exercises.
 */
export async function getAllPRs() {
  const logs = await db.workoutLogs.toArray();
  const prMap = {}; // exerciseId -> { weight, reps, date }

  for (const log of logs) {
    if (!log.exercises) continue;
    for (const ex of log.exercises) {
      if (!ex.sets) continue;
      for (const set of ex.sets) {
        if (!set.completed || set.isWarmup) continue;
        const current = prMap[ex.exerciseId];
        if (!current || set.weight > current.weight ||
            (set.weight === current.weight && set.reps > current.reps)) {
          prMap[ex.exerciseId] = {
            weight: set.weight,
            reps: set.reps,
            date: log.date,
          };
        }
      }
    }
  }

  return prMap;
}

/**
 * Get exercise history: array of { date, sets: [...] } sorted by date.
 */
export async function getExerciseHistory(exerciseId) {
  const logs = await db.workoutLogs.orderBy('date').toArray();
  const history = [];

  for (const log of logs) {
    if (!log.exercises) continue;
    for (const ex of log.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      if (!ex.sets || ex.sets.length === 0) continue;
      history.push({
        date: log.date,
        sets: ex.sets.filter((s) => s.completed && !s.isWarmup),
      });
    }
  }

  return history;
}
