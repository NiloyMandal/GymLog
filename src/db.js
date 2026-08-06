import Dexie from 'dexie';

export const db = new Dexie('GymLogDB');

db.version(1).stores({
  exercises: '++id, name, muscleGroup',
  routines: '++id, name',
  workoutLogs: '++id, date, routineId',
  bodyMetrics: '++id, date',
  settings: 'key',
});

// v2: add draftWorkout table for crash-safe mid-workout persistence
db.version(2).stores({
  exercises: '++id, name, muscleGroup',
  routines: '++id, name',
  workoutLogs: '++id, date, routineId',
  bodyMetrics: '++id, date',
  settings: 'key',
  draftWorkout: 'id', // singleton row, id always = 1
});

// v3: migrate to UUIDs and add multi-entry index for historical lookups
db.version(3).stores({
  exercises: 'id, name, muscleGroup',
  routines: 'id, name',
  workoutLogs: 'id, date, routineId, *exercises.exerciseId',
  bodyMetrics: 'id, date',
  settings: 'key',
  draftWorkout: 'id',
});

// v4: add formCues and videoUrl to exercises
db.version(4).stores({
  exercises: 'id, name, muscleGroup, *formCues',
  routines: 'id, name',
  workoutLogs: 'id, date, routineId, *exercises.exerciseId',
  bodyMetrics: 'id, date',
  settings: 'key',
  draftWorkout: 'id',
});

// Handle schema changes automatically (since PK changes are not supported seamlessly)
db.on('ready', function () {
  // Catch upgrade errors before they happen, though Dexie usually throws on open
});

import SEED_EXERCISES from './data/exercises.json';

// Seed routines — IDs will be assigned after exercises are inserted
const SEED_ROUTINES_TEMPLATE = [
  {
    name: 'Push Day',
    exerciseNames: [
      { name: 'Barbell Bench Press', targetSets: 4, targetReps: 8 },
      { name: 'Incline Dumbbell Press', targetSets: 3, targetReps: 10 },
      { name: 'Overhead Press', targetSets: 4, targetReps: 8 },
      { name: 'Dumbbell Lateral Raise', targetSets: 3, targetReps: 15 },
      { name: 'Tricep Pushdown', targetSets: 3, targetReps: 12 },
      { name: 'Overhead Tricep Extension', targetSets: 3, targetReps: 12 },
    ],
  },
  {
    name: 'Pull Day',
    exerciseNames: [
      { name: 'Deadlift', targetSets: 4, targetReps: 5 },
      { name: 'Pull-Up', targetSets: 4, targetReps: 8 },
      { name: 'Barbell Row', targetSets: 4, targetReps: 8 },
      { name: 'Face Pull', targetSets: 3, targetReps: 15 },
      { name: 'Barbell Curl', targetSets: 3, targetReps: 10 },
      { name: 'Hammer Curl', targetSets: 3, targetReps: 12 },
    ],
  },
  {
    name: 'Leg Day',
    exerciseNames: [
      { name: 'Barbell Squat', targetSets: 4, targetReps: 8 },
      { name: 'Romanian Deadlift', targetSets: 4, targetReps: 10 },
      { name: 'Leg Press', targetSets: 3, targetReps: 12 },
      { name: 'Leg Curl', targetSets: 3, targetReps: 12 },
      { name: 'Leg Extension', targetSets: 3, targetReps: 12 },
      { name: 'Calf Raise', targetSets: 4, targetReps: 15 },
    ],
  },
];

export async function initDB() {
  try {
    await db.open();
  } catch (err) {
    console.error("Database open failed, likely due to schema upgrade. Wiping...", err);
    await db.delete();
    await db.open();
  }
}

export async function seedDatabase() {
  const exerciseCount = await db.exercises.count();
  
  if (exerciseCount > 0) {
    // Backfill images and formCues for existing seeded exercises, and insert missing ones
    const existingExercises = await db.exercises.toArray();
    const existingNames = new Set(existingExercises.map(e => e.name));
    
    let updated = 0;
    
    for (const ex of existingExercises) {
      if (!ex.images || ex.images.length === 0 || !ex.formCues) {
        // We do a case-insensitive search to match old defaults to the new JSON dataset
        const seedMatch = SEED_EXERCISES.find(s => s.name.toLowerCase() === ex.name.toLowerCase());
        if (seedMatch) {
          await db.exercises.update(ex.id, {
            images: seedMatch.images,
            formCues: seedMatch.formCues
          });
          updated++;
        }
      }
    }
    if (updated > 0) console.log(`Backfilled ${updated} exercises with images/formCues`);

    // Insert any new exercises from the JSON that aren't in the DB yet
    const missingExercises = SEED_EXERCISES.filter(s => !existingNames.has(s.name));
    if (missingExercises.length > 0) {
      const exercisesWithIds = missingExercises.map(ex => ({ ...ex, id: crypto.randomUUID(), defaultUnit: 'kg' }));
      await db.exercises.bulkAdd(exercisesWithIds);
      console.log(`Inserted ${missingExercises.length} new exercises from dataset.`);
    }

    return; // Stop here since DB was already seeded with routines initially
  }

  // Insert exercises with UUIDs
  const exercisesWithIds = SEED_EXERCISES.map(ex => ({ ...ex, id: crypto.randomUUID(), defaultUnit: 'kg' }));
  await db.exercises.bulkAdd(exercisesWithIds);

  // Build name → id map
  const nameToId = {};
  exercisesWithIds.forEach((ex) => {
    nameToId[ex.name] = ex.id;
  });

  // Insert routines with resolved exercise IDs
  const routines = SEED_ROUTINES_TEMPLATE.map((r) => ({
    id: crypto.randomUUID(),
    name: r.name,
    exercises: r.exerciseNames.map((e) => ({
      exerciseId: nameToId[e.name],
      targetSets: e.targetSets,
      targetReps: e.targetReps,
    })),
  }));

  await db.routines.bulkAdd(routines);

  // Set defaults
  await db.settings.bulkPut([
    { key: 'unit', value: 'kg' },
    { key: 'restTimerSeconds', value: 90 },
    { key: 'lastRoutineIndex', value: 0 },
    { key: 'trackRPE', value: false },
    { key: 'barWeight', value: 20 },
  ]);
}

export const MUSCLE_GROUPS = [
  'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio',
];

export const MUSCLE_GROUP_COLORS = {
  chest: '#f97316',
  back: '#3b82f6',
  legs: '#8b5cf6',
  shoulders: '#ec4899',
  arms: '#14b8a6',
  core: '#f59e0b',
  cardio: '#ef4444',
};

export const MUSCLE_GROUP_LABELS = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  cardio: 'Cardio',
};
