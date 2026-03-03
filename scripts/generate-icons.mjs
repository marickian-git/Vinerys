import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('./public/icons', { recursive: true });

// SVG sursă — logo Vinerys (🍷 stilizat)
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0d0608"/>
  <rect width="512" height="512" rx="96" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b1a2e"/>
      <stop offset="100%" style="stop-color:#c44569"/>
    </linearGradient>
  </defs>
  <!-- Pahar vin stilizat -->
  <path d="M256 80 C200 80 160 130 160 190 C160 240 190 278 230 292 L225 370 L190 370 L190 400 L322 400 L322 370 L287 370 L282 292 C322 278 352 240 352 190 C352 130 312 80 256 80Z" 
        fill="none" stroke="rgba(245,230,232,0.9)" stroke-width="18" stroke-linejoin="round"/>
  <!-- Picatura vin -->
  <ellipse cx="256" cy="200" rx="45" ry="55" fill="rgba(196,69,105,0.6)"/>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`./public/icons/icon-${size}.png`);
  console.log(`✅ icon-${size}.png`);
}

console.log('\n🍷 Toate icoanele au fost generate în public/icons/');