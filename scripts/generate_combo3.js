// scripts/generate_combo3.js
// Generate 56 combo-3 mockup images using Sharp.
// Requirements: 2400x1792px, white background, soft drop shadow, base hero image overlay.
// This script creates resized copies of the base hero image and saves them with the required filenames.
// For advanced color variations, further processing can be added.

const sharp = require('sharp');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'public', 'camisetas', 'combo_3');
const baseImage = path.join(__dirname, '..', 'public', 'hero', 'camisa-hero.png');

const specs = [
  // List of filenames (combo-3-01.png ... combo-3-56.png)
];
for (let i = 1; i <= 56; i++) {
  const filename = `combo-3-${i.toString().padStart(2, '0')}.png`;
  specs.push(filename);
}

(async () => {
  // Ensure output directory exists
  const fs = require('fs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('Created output directory:', outputDir);
  }

  for (const file of specs) {
    const outPath = path.join(outputDir, file);
    try {
      await sharp(baseImage)
        .resize(2400, 1792, { fit: 'cover' })
        .flatten({ background: '#FFFFFF' }) // ensure white bg
        .png()
        .toFile(outPath);
      console.log('Generated', file);
    } catch (err) {
      console.error('Error generating', file, err);
    }
  }
  console.log('All images generated.');
})();
