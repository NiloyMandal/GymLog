import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEW_DATASET_DIR = '/tmp/exercises-dataset2';
const OUTPUT_DATA_PATH = path.join(__dirname, '../src/data/exercises.json');
const OUTPUT_VIDEOS_DIR = path.join(__dirname, '../public/videos/exercises');

// GymLog muscle groups: 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'
const MUSCLE_MAP = {
  'waist': 'core',
  'upper legs': 'legs',
  'lower legs': 'legs',
  'upper arms': 'arms',
  'lower arms': 'arms',
  'back': 'back',
  'chest': 'chest',
  'shoulders': 'shoulders',
  'cardio': 'cardio',
  'neck': 'shoulders', // Fallback
};

function copyGifsAndGenerateJson() {
  console.log('Reading hasaneyldrm dataset...');
  
  // 1. Read the JSON
  const rawData = fs.readFileSync(path.join(NEW_DATASET_DIR, 'data/exercises.json'), 'utf-8');
  const dataset = JSON.parse(rawData);
  
  // 2. Read the videos directory to create an ID -> filename mapping
  const videoFiles = fs.readdirSync(path.join(NEW_DATASET_DIR, 'videos'));
  const idToVideo = {};
  for (const file of videoFiles) {
    if (file.endsWith('.gif')) {
      const id = file.split('-')[0];
      idToVideo[id] = file;
    }
  }

  // 3. Ensure output directory exists
  if (!fs.existsSync(OUTPUT_VIDEOS_DIR)) {
    fs.mkdirSync(OUTPUT_VIDEOS_DIR, { recursive: true });
  }

  const gymLogExercises = [];
  let copied = 0;

  for (const ex of dataset) {
    const videoFile = idToVideo[ex.id];
    
    // Only include exercises that have an English instruction and a video
    if (videoFile && ex.instruction_steps && ex.instruction_steps.en && ex.instruction_steps.en.length > 0) {
      
      // Copy the gif
      const sourcePath = path.join(NEW_DATASET_DIR, 'videos', videoFile);
      const destName = `${ex.id}.gif`;
      const destPath = path.join(OUTPUT_VIDEOS_DIR, destName);
      
      fs.copyFileSync(sourcePath, destPath);
      copied++;

      // Create the GymLog exercise object
      gymLogExercises.push({
        name: ex.name,
        muscleGroup: MUSCLE_MAP[ex.body_part] || 'core', // Default to core if unknown
        formCues: ex.instruction_steps.en,
        videoUrl: `/videos/exercises/${destName}`,
      });
    }
  }

  // 4. Write the final exercises.json
  fs.writeFileSync(OUTPUT_DATA_PATH, JSON.stringify(gymLogExercises, null, 2));

  console.log(`✅ Successfully processed ${copied} exercises.`);
  console.log(`Generated JSON at: ${OUTPUT_DATA_PATH}`);
  console.log(`Copied GIFs to: ${OUTPUT_VIDEOS_DIR}`);
}

copyGifsAndGenerateJson();
