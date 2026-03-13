const https = require('https');
const fs = require('fs');
const path = require('path');

// Use jsdelivr CDN which is more reliable
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
const OUTPUT_DIR = path.join(__dirname, 'public', 'models');

const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

// Create models directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('📥 Downloading face recognition models from CDN...\n');

let downloaded = 0;
let failed = 0;

models.forEach((model) => {
  const url = `${MODEL_URL}/${model}`;
  const outputPath = path.join(OUTPUT_DIR, model);

  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`✓ ${model} already exists, skipping...`);
    downloaded++;
    checkComplete();
    return;
  }

  console.log(`⬇️  Downloading ${model}...`);

  const file = fs.createWriteStream(outputPath);

  https.get(url, (response) => {
    if (response.statusCode === 200) {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✓ ${model} downloaded successfully`);
        downloaded++;
        checkComplete();
      });
    } else {
      console.error(`✗ Failed to download ${model}: HTTP ${response.statusCode}`);
      failed++;
      checkComplete();
    }
  }).on('error', (err) => {
    fs.unlink(outputPath, () => {});
    console.error(`✗ Error downloading ${model}:`, err.message);
    failed++;
    checkComplete();
  });
});

function checkComplete() {
  if (downloaded + failed === models.length) {
    console.log(`\n📊 Download Summary:`);
    console.log(`   ✓ Successfully downloaded: ${downloaded}/${models.length}`);
    if (failed > 0) {
      console.log(`   ✗ Failed: ${failed}/${models.length}`);
      console.log(`\n⚠️  Some models failed to download. You can:`);
      console.log(`   1. Try running 'npm run download-models' again`);
      console.log(`   2. Download manually from: https://github.com/vladmandic/face-api/tree/master/model`);
    } else {
      console.log('\n✅ All face recognition models are ready!');
    }
  }
}
