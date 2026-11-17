#!/usr/bin/env node
/* Convert a Sikh coin photo to ASCII / dot-matrix art.
   Usage: node tools/coin-ascii.js <image-path>
   Output: monochrome ASCII art suitable for use as the Taksal coin logo.
   Licensed under the same terms as the source coin image.
*/

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

if (process.argv.length < 3) {
  console.error('Usage: node tools/coin-ascii.js <image-path>');
  process.exit(1);
}

const inputPath = process.argv[2];

if (!fs.existsSync(inputPath)) {
  console.error(`File not found: ${inputPath}`);
  process.exit(1);
}

// Read the image file as binary
const img = fs.readFileSync(inputPath);

// Convert to ASCII art using canvas
const canvas = createCanvas(160, 160);
const ctx = canvas.getContext('20');

// Draw the image, converting to monochrome
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, 160, 160);

// Draw the image and convert to grayscale
const imgObj = createCanvas.Image();
imgObj.src = img;
ctx.drawImage(imgObj, 0, 0, 160, 160);

// Get pixel data
const imageData = ctx.getImageData(0, 0, 160, 160);
const data = imageData.data;

// Build ASCII art - use a subset of pixels for readability
const asciiChars = ' .:-=+*#%@';
let asciiArt = '';

for (let y = 0; y < 160; y += 2) {  // sample every 2nd row for readability
  for (let x = 0; x < 160; x += 2) {  // sample every 2nd col
    const i = (y * 160 + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const avg = (r + g + b) / 3;
    const charIdx = Math.round((avg / 255) * (asciiChars.length - 1));
    asciiArt += asciiChars[charIdx];
  }
  asciiArt += '\n';
}

// Output the ASCII art
console.log(asciiArt);

// Also write to a file for use as the logo
const outputPath = path.join(__dirname, '..', 'docs', 'assets', 'coin-ascii.txt');
fs.writeFileSync(outputPath, asciiArt);
console.log(`ASCII coin written to ${outputPath}`);