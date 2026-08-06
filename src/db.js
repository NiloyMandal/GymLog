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

const DEFAULT_VIDEO = '/videos/placeholder.webm';
const DEFAULT_CUES = ['Keep back straight', 'Control the eccentric', 'Breathe out on exertion'];

const SEED_EXERCISES = [
  // Chest
  { name: 'Barbell Bench Press', muscleGroup: 'chest', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Plant feet firmly', 'Keep shoulders retracted', 'Touch chest lightly'] },
  { name: 'Incline Dumbbell Press', muscleGroup: 'chest', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Bench at 30-45 degrees', 'Press in an arc', 'Squeeze pecs at top'] },
  { name: 'Decline Bench Press', muscleGroup: 'chest', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Dumbbell Flyes', muscleGroup: 'chest', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Cable Crossover', muscleGroup: 'chest', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Push-Up', muscleGroup: 'chest', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Brace core', 'Elbows at 45 degrees', 'Full range of motion'] },
  { name: 'Chest Dip', muscleGroup: 'chest', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },

  // Back
  { name: 'Barbell Row', muscleGroup: 'back', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Hinge at hips', 'Pull to belly button', 'Keep spine neutral'] },
  { name: 'Pull-Up', muscleGroup: 'back', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Dead hang start', 'Pull chest to bar', 'Depress shoulder blades'] },
  { name: 'Lat Pulldown', muscleGroup: 'back', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Seated Cable Row', muscleGroup: 'back', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Dumbbell Row', muscleGroup: 'back', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'T-Bar Row', muscleGroup: 'back', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Face Pull', muscleGroup: 'back', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Deadlift', muscleGroup: 'back', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Bar over mid-foot', 'Hips above knees', 'Drive floor away'] },

  // Legs
  { name: 'Barbell Squat', muscleGroup: 'legs', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Chest up', 'Knees track toes', 'Break parallel'] },
  { name: 'Leg Press', muscleGroup: 'legs', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Romanian Deadlift', muscleGroup: 'legs', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Soft knees', 'Hinge back', 'Stretch hamstrings'] },
  { name: 'Leg Extension', muscleGroup: 'legs', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Leg Curl', muscleGroup: 'legs', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Bulgarian Split Squat', muscleGroup: 'legs', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Calf Raise', muscleGroup: 'legs', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Hack Squat', muscleGroup: 'legs', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Hip Thrust', muscleGroup: 'legs', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },

  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'shoulders', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Brace glutes', 'Press vertically', 'Head through at top'] },
  { name: 'Dumbbell Lateral Raise', muscleGroup: 'shoulders', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Slight elbow bend', 'Pour the pitcher', 'Control descent'] },
  { name: 'Front Raise', muscleGroup: 'shoulders', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Arnold Press', muscleGroup: 'shoulders', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Reverse Pec Deck', muscleGroup: 'shoulders', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Upright Row', muscleGroup: 'shoulders', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },

  // Arms
  { name: 'Barbell Curl', muscleGroup: 'arms', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Pin elbows to sides', 'Full stretch', 'No swinging'] },
  { name: 'Dumbbell Curl', muscleGroup: 'arms', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Hammer Curl', muscleGroup: 'arms', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Preacher Curl', muscleGroup: 'arms', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Tricep Pushdown', muscleGroup: 'arms', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Elbows fixed', 'Flare triceps at bottom', 'Control up'] },
  { name: 'Skull Crusher', muscleGroup: 'arms', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Overhead Tricep Extension', muscleGroup: 'arms', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Close-Grip Bench Press', muscleGroup: 'arms', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },

  // Core
  { name: 'Plank', muscleGroup: 'core', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Squeeze glutes', 'Posterior pelvic tilt', 'Hold steady'] },
  { name: 'Hanging Leg Raise', muscleGroup: 'core', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Cable Crunch', muscleGroup: 'core', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Ab Rollout', muscleGroup: 'core', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Russian Twist', muscleGroup: 'core', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Bicycle Crunch', muscleGroup: 'core', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },

  // Cardio
  { name: 'Treadmill Run', muscleGroup: 'cardio', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Maintain steady pace', 'Mid-foot strike'] },
  { name: 'Rowing Machine', muscleGroup: 'cardio', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: ['Legs, core, arms', 'Arms, core, legs'] },
  { name: 'Cycling', muscleGroup: 'cardio', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Jump Rope', muscleGroup: 'cardio', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
  { name: 'Stair Climber', muscleGroup: 'cardio', defaultUnit: 'kg', videoUrl: DEFAULT_VIDEO, formCues: DEFAULT_CUES },
];

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
    // Backfill videoUrl and formCues for existing seeded exercises
    const existingExercises = await db.exercises.toArray();
    let updated = 0;
    
    for (const ex of existingExercises) {
      if (!ex.videoUrl || !ex.formCues) {
        const seedMatch = SEED_EXERCISES.find(s => s.name === ex.name);
        if (seedMatch) {
          await db.exercises.update(ex.id, {
            videoUrl: seedMatch.videoUrl,
            formCues: seedMatch.formCues
          });
          updated++;
        }
      }
    }
    if (updated > 0) console.log(`Backfilled ${updated} exercises with videoUrl/formCues`);
    return; // Stop here if already seeded
  }

  // Insert exercises with UUIDs
  const exercisesWithIds = SEED_EXERCISES.map(ex => ({ ...ex, id: crypto.randomUUID() }));
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
