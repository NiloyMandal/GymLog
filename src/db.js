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

const SEED_ROUTINES_TEMPLATE = [
  {
    name: 'Mon: Back + Biceps',
    exerciseNames: [
      { name: 'pull-up', targetSets: 3, targetReps: 10 },
      { name: 'reverse grip machine lat pulldown', targetSets: 3, targetReps: 10 },
      { name: 'lever reverse t-bar row', targetSets: 3, targetReps: 10 },
      { name: 'cable seated row', targetSets: 3, targetReps: 10 },
      { name: 'cable deadlift', targetSets: 3, targetReps: 10 },
      { name: 'cable seated row', targetSets: 3, targetReps: 10 },
      { name: 'barbell curl', targetSets: 3, targetReps: 10 },
      { name: 'cable preacher curl', targetSets: 3, targetReps: 10 },
    ],
  },
  {
    name: 'Tue: Shoulders + Deltoids',
    exerciseNames: [
      { name: 'band twisting overhead press', targetSets: 3, targetReps: 10 },
      { name: 'cable lateral raise', targetSets: 3, targetReps: 10 },
      { name: 'cable lateral raise', targetSets: 3, targetReps: 10 },
      { name: 'cable upright row', targetSets: 3, targetReps: 10 },
      { name: 'cable upright row', targetSets: 3, targetReps: 10 },
      { name: 'band shrug', targetSets: 3, targetReps: 10 },
      { name: 'jump rope', targetSets: 3, targetReps: 10 },
    ],
  },
  {
    name: 'Wed: Chest + Triceps',
    exerciseNames: [
      { name: 'cable incline bench press', targetSets: 3, targetReps: 10 },
      { name: 'dumbbell bench press', targetSets: 3, targetReps: 10 },
      { name: 'dumbbell bench press', targetSets: 3, targetReps: 10 },
      { name: 'chest dip', targetSets: 3, targetReps: 10 },
      { name: 'chest dip', targetSets: 3, targetReps: 10 },
      { name: 'lever triceps extension', targetSets: 3, targetReps: 10 },
      { name: 'barbell reverse grip skullcrusher', targetSets: 3, targetReps: 10 },
    ],
  },
  {
    name: 'Thu: Shoulders + Abs',
    exerciseNames: [
      { name: 'band twisting overhead press', targetSets: 3, targetReps: 10 },
      { name: 'cable lateral raise', targetSets: 3, targetReps: 10 },
      { name: 'cable upright row', targetSets: 3, targetReps: 10 },
      { name: 'band shrug', targetSets: 3, targetReps: 10 },
      { name: 'jump rope', targetSets: 3, targetReps: 10 },
      { name: 'hanging leg raise', targetSets: 3, targetReps: 10 },
      { name: 'lying leg raise flat bench', targetSets: 3, targetReps: 10 },
      { name: '3/4 sit-up', targetSets: 3, targetReps: 10 },
      { name: 'cable side crunch', targetSets: 3, targetReps: 10 },
      { name: 'mountain climber', targetSets: 3, targetReps: 10 },
      { name: 'power point plank', targetSets: 3, targetReps: 10 },
    ],
  },
  {
    name: 'Fri: Arms',
    exerciseNames: [
      { name: 'barbell curl', targetSets: 3, targetReps: 10 },
      { name: 'barbell reverse grip skullcrusher', targetSets: 3, targetReps: 10 },
      { name: 'cable preacher curl', targetSets: 3, targetReps: 10 },
      { name: 'lever triceps extension', targetSets: 3, targetReps: 10 },
      { name: 'dumbbell hammer curl', targetSets: 3, targetReps: 10 },
      { name: 'three bench dip', targetSets: 3, targetReps: 10 },
      { name: 'band concentration curl', targetSets: 3, targetReps: 10 },
      { name: 'cable kickback', targetSets: 3, targetReps: 10 },
      { name: 'lever bicep curl', targetSets: 3, targetReps: 10 },
    ],
  },
  {
    name: 'Sat: Legs + Abs + Cardio',
    exerciseNames: [
      { name: 'barbell squat (on knees)', targetSets: 3, targetReps: 10 },
      { name: 'smith leg press', targetSets: 3, targetReps: 10 },
      { name: 'sled hack squat', targetSets: 3, targetReps: 10 },
      { name: 'lever leg extension', targetSets: 3, targetReps: 10 },
      { name: 'lever lying leg curl', targetSets: 3, targetReps: 10 },
      { name: 'sissy squat', targetSets: 3, targetReps: 10 },
      { name: 'split squats', targetSets: 3, targetReps: 10 },
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
      if (!ex.videoUrl || ex.videoUrl === '/videos/placeholder.webm' || !ex.formCues || ex.images) {
        // We do a case-insensitive search to match old defaults to the new JSON dataset
        let seedMatch = SEED_EXERCISES.find(s => s.name.toLowerCase() === ex.name.toLowerCase());
        
        // Fallback 1: The new dataset name contains our old legacy name
        if (!seedMatch) {
          seedMatch = SEED_EXERCISES.find(s => s.name.toLowerCase().includes(ex.name.toLowerCase()));
        }

        // Fallback 2: Our old legacy name contains the new dataset name
        if (!seedMatch) {
          seedMatch = SEED_EXERCISES.find(s => ex.name.toLowerCase().includes(s.name.toLowerCase()));
        }

        if (seedMatch) {
          await db.exercises.update(ex.id, {
            videoUrl: seedMatch.videoUrl,
            formCues: seedMatch.formCues,
            images: undefined // Clear out old flipbook images if any
          });
          updated++;
        }
      }
    }
    if (updated > 0) console.log(`Backfilled ${updated} exercises with videoUrl/formCues`);

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
