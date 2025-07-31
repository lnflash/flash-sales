// Simple script to generate PWA icons
// Run this with: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for the Flash icon
const createSvgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#00A86B" rx="${size * 0.2}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.5}px">F</text>
</svg>
`;

// Since we can't use canvas without dependencies, let's create placeholder files
const sizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

console.log('Creating icon placeholder files...');
console.log('Note: These are placeholder files. For production, you should:');
console.log('1. Use a proper image editing tool or online service to create PNG icons');
console.log('2. Ensure icons have proper padding for maskable icons');
console.log('3. Use your brand colors and logo\n');

sizes.forEach(size => {
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  // Create an empty file as placeholder
  fs.writeFileSync(filename, '');
  console.log(`Created placeholder: ${filename}`);
});

// Create SVG icon that can be used as a base
const svgPath = path.join(iconsDir, 'icon.svg');
fs.writeFileSync(svgPath, createSvgIcon(512));
console.log(`\nCreated SVG icon template: ${svgPath}`);
console.log('You can use this SVG as a base to create PNG icons.');

// Create favicon files
const faviconSizes = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32
};

Object.entries(faviconSizes).forEach(([filename, size]) => {
  const filepath = path.join(__dirname, '..', 'public', filename);
  fs.writeFileSync(filepath, '');
  console.log(`Created placeholder: ${filepath}`);
});

console.log('\nNext steps:');
console.log('1. Use an online tool like https://realfavicongenerator.net/');
console.log('2. Or use a design tool to create proper PNG icons');
console.log('3. Replace the placeholder files with actual PNG images');
console.log('4. Ensure maskable icons have proper safe area padding');