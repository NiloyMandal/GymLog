import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';

const execAsync = promisify(exec);

const PUBLIC_VIDEOS_DIR = path.resolve('./public/videos');
const TEMP_DIR = path.resolve('./scripts/temp_videos');

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function fetchWgerVideos() {
  console.log('Fetching video metadata from wger API...');
  return new Promise((resolve, reject) => {
    https.get('https://wger.de/api/v2/video/?limit=100', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data).results));
      res.on('error', reject);
    });
  });
}

async function run() {
  if (!fs.existsSync(PUBLIC_VIDEOS_DIR)) fs.mkdirSync(PUBLIC_VIDEOS_DIR, { recursive: true });

  try {
    // Download a single placeholder from Wikimedia 
    const placeholderUrl = 'https://upload.wikimedia.org/wikipedia/commons/2/22/Volcano_Lava_Sample.webm';
    const placeholderPath = path.join(PUBLIC_VIDEOS_DIR, 'placeholder.webm');
    
    console.log(`Downloading placeholder to ${placeholderPath}...`);
    await downloadFile(placeholderUrl, placeholderPath);

    console.log('Done! db.js already references /videos/placeholder.webm');

  } catch (err) {
    console.error('Error during video seeding:', err);
  }
}

run();
