const fs = require('fs');
const path = require('path');

// Read the SVG file
const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf-8');

// Generate PNG files using sharp (if available) or provide instructions
async function generateIcons() {
  try {
    const sharp = require('sharp');

    const sizes = [192, 512];

    for (const size of sizes) {
      const outputPath = path.join(__dirname, '..', 'public', `icon-${size}.png`);

      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${outputPath}`);
    }

    console.log('\nAll icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('Sharp not found. Installing sharp...');
      console.log('\nPlease run: npm install --save-dev sharp');
      console.log('Then run this script again: node scripts/generate-icons.js');
    } else {
      console.error('Error generating icons:', error);
    }
  }
}

generateIcons();
