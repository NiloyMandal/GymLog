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
    "name": "Monday: Back & Biceps",
    "exerciseNames": [
      {
        "name": "Cable Lat Pulldown",
        "targetSets": 3,
        "targetReps": "8-10"
      },
      {
        "name": "Lever T-Bar Row",
        "targetSets": 3,
        "targetReps": "8-10"
      },
      {
        "name": "Cable Seated Row",
        "targetSets": 3,
        "targetReps": "10-12"
      },
      {
        "name": "Dumbbell Single-Arm Row",
        "targetSets": 2,
        "targetReps": "10-12"
      },
      {
        "name": "Barbell Biceps Curl",
        "targetSets": 3,
        "targetReps": "10-12"
      },
      {
        "name": "EZ-Bar Preacher Curl",
        "targetSets": 3,
        "targetReps": "12-15"
      }
    ]
  },
  {
    "name": "Tuesday: Shoulders & Traps",
    "exerciseNames": [
      {
        "name": "Dumbbell Seated Shoulder Press",
        "targetSets": 3,
        "targetReps": "8-10"
      },
      {
        "name": "Dumbbell Lateral Raise",
        "targetSets": 3,
        "targetReps": "12-15"
      },
      {
        "name": "Cable Rope Face Pull",
        "targetSets": 3,
        "targetReps": "12-15"
      },
      {
        "name": "Dumbbell Shrug",
        "targetSets": 3,
        "targetReps": "10-12"
      },
      {
        "name": "Walking on Treadmill",
        "targetSets": 1,
        "targetReps": "15-20 min"
      }
    ]
  },
  {
    "name": "Wednesday: Chest & Triceps",
    "exerciseNames": [
      {
        "name": "Barbell Bench Press",
        "targetSets": 3,
        "targetReps": "6-8"
      },
      {
        "name": "Dumbbell Incline Bench Press",
        "targetSets": 3,
        "targetReps": "8-10"
      },
      {
        "name": "Lever Pec Deck Fly",
        "targetSets": 3,
        "targetReps": "12-15"
      },
      {
        "name": "Cable High-to-Low Crossover",
        "targetSets": 2,
        "targetReps": "12-15"
      },
      {
        "name": "Cable Triceps Pushdown (Rope)",
        "targetSets": 3,
        "targetReps": "10-12"
      },
      {
        "name": "EZ-Bar Lying Triceps Extension",
        "targetSets": 3,
        "targetReps": "10-12"
      }
    ]
  },
  {
    "name": "Thursday: Shoulders, Rear Delts & Core",
    "exerciseNames": [
      {
        "name": "Lever Seated Shoulder Press",
        "targetSets": 3,
        "targetReps": "10-12"
      },
      {
        "name": "Cable One-Arm Lateral Raise",
        "targetSets": 3,
        "targetReps": "12-15"
      },
      {
        "name": "Lever Reverse Fly",
        "targetSets": 3,
        "targetReps": "12-15"
      },
      {
        "name": "Hanging Leg Raise",
        "targetSets": 3,
        "targetReps": "10-15"
      },
      {
        "name": "Crunch",
        "targetSets": 3,
        "targetReps": "15-20"
      },
      {
        "name": "Front Plank",
        "targetSets": 3,
        "targetReps": "45-60s"
      }
    ]
  },
  {
    "name": "Friday: Arms Focus",
    "exerciseNames": [
      {
        "name": "Dumbbell Alternating Biceps Curl",
        "targetSets": 3,
        "targetReps": "10-12"
      },
      {
        "name": "Dumbbell Incline Hammer Curl",
        "targetSets": 3,
        "targetReps": "10-12"
      },
      {
        "name": "Cable Overhead Triceps Extension",
        "targetSets": 3,
        "targetReps": "10-12"
      },
      {
        "name": "Triceps Dip",
        "targetSets": 3,
        "targetReps": "8-12"
      },
      {
        "name": "Cable Concentration Curl",
        "targetSets": 2,
        "targetReps": "12-15"
      },
      {
        "name": "Cable Triceps Kickback",
        "targetSets": 2,
        "targetReps": "12-15"
      }
    ]
  },
  {
    "name": "Saturday: Legs, Core & Cardio",
    "exerciseNames": [
      {
        "name": "Barbell Full Squat",
        "targetSets": 3,
        "targetReps": "6-8"
      },
      {
        "name": "Sled 45° Leg Press",
        "targetSets": 3,
        "targetReps": "10-12"
      },
      {
        "name": "Barbell Romanian Deadlift",
        "targetSets": 3,
        "targetReps": "8-10"
      },
      {
        "name": "Lever Lying Leg Curl",
        "targetSets": 3,
        "targetReps": "10-12"
      },
      {
        "name": "Lever Leg Extension",
        "targetSets": 3,
        "targetReps": "12-15"
      },
      {
        "name": "Lever Standing Calf Raise",
        "targetSets": 4,
        "targetReps": "12-15"
      },
      {
        "name": "Mountain Climber",
        "targetSets": 3,
        "targetReps": "15-20"
      }
    ]
  }
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
