import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fsSync from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const EXERCISES_DIR = path.join(PUBLIC_DIR, 'exercises');
const OUTPUT_JSON = path.join(__dirname, '..', 'src', 'data', 'exercises.json');

const EXERCISE_DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        return;
      }
      const file = fsSync.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
}

function mapMuscleGroup(primaryMuscles) {
  if (!primaryMuscles || primaryMuscles.length === 0) return 'full_body';
  const m = primaryMuscles[0].toLowerCase();
  if (['abdominals'].includes(m)) return 'core';
  if (['hamstrings', 'calves', 'quadriceps', 'glutes', 'adductors', 'abductors', 'quads'].includes(m)) return 'legs';
  if (['shoulders', 'trapezius', 'neck', 'traps'].includes(m)) return 'shoulders';
  if (['biceps', 'triceps', 'forearms'].includes(m)) return 'arms';
  if (['chest'].includes(m)) return 'chest';
  if (['middle back', 'lower back', 'lats'].includes(m)) return 'back';
  return 'full_body';
}

async function run() {
  console.log('Fetching ExerciseDB JSON...');
  let data;
  try {
    const res = await fetch(EXERCISE_DB_URL);
    data = await res.json();
  } catch (err) {
    console.error('Failed to fetch ExerciseDB JSON', err);
    return;
  }

  console.log(`Found ${data.length} exercises. Processing...`);

  await fs.mkdir(EXERCISES_DIR, { recursive: true });
  await fs.mkdir(path.join(__dirname, '..', 'src', 'data'), { recursive: true });

  const processed = [];
  let downloadedCount = 0;

  // Process sequentially to avoid overwhelming the server/rate limits, but batch by 20 for speed
  for (let i = 0; i < data.length; i += 20) {
    const batch = data.slice(i, i + 20);
    const promises = batch.map(async (ex) => {
      const muscleGroup = mapMuscleGroup(ex.primaryMuscles);
      const finalGroup = ex.category === 'cardio' ? 'cardio' : muscleGroup;

      const newEx = {
        name: ex.name,
        muscleGroup: finalGroup,
        formCues: ex.instructions || [],
        images: []
      };

      if (ex.images && ex.images.length === 2) {
        const idDir = ex.id; // e.g. "3_4_Sit-Up"
        const localDir = path.join(EXERCISES_DIR, idDir);
        await fs.mkdir(localDir, { recursive: true });

        const img0Url = `${IMAGE_BASE_URL}${encodeURIComponent(ex.images[0])}`;
        const img1Url = `${IMAGE_BASE_URL}${encodeURIComponent(ex.images[1])}`;
        const img0Local = path.join(localDir, '0.jpg');
        const img1Local = path.join(localDir, '1.jpg');

        try {
          // Check if already downloaded
          await fs.access(img0Local);
          await fs.access(img1Local);
        } catch {
          await downloadImage(img0Url, img0Local).catch(e => console.error(`Error img0: ${e.message}`));
          await downloadImage(img1Url, img1Local).catch(e => console.error(`Error img1: ${e.message}`));
        }

        newEx.images = [`/exercises/${idDir}/0.jpg`, `/exercises/${idDir}/1.jpg`];
        downloadedCount += 2;
      }

      return newEx;
    });

    const results = await Promise.all(promises);
    processed.push(...results);
    console.log(`Processed ${Math.min(i + 20, data.length)} / ${data.length}...`);
  }

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(processed, null, 2));
  console.log(`Done! Downloaded images for ${processed.length} exercises.`);
}

run();
