/**
 * generate-icons.js
 * Generates the 4 required extension icons (16, 32, 48, 128px)
 * as simple SVG-derived PNGs using the Canvas API.
 *
 * Run once: node generate-icons.js
 * Requires: npm install canvas
 *
 * If you prefer, use any image editor to create icons manually
 * and place them in extension/icons/ with these exact filenames:
 *   icon16.png, icon32.png, icon48.png, icon128.png
 */

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const SIZES = [16, 32, 48, 128];
const OUT_DIR = path.join(__dirname, "extension", "icons");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  const radius = size * 0.18;

  // Background gradient (indigo → purple)
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#6366f1");
  grad.addColorStop(1, "#8b5cf6");

  // Rounded rectangle background
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Accessibility person icon (simplified ♿ symbol)
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `bold ${Math.round(size * 0.6)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("♿", size / 2, size / 2 + size * 0.04);

  return canvas.toBuffer("image/png");
}

SIZES.forEach((size) => {
  const buffer = drawIcon(size);
  const outPath = path.join(OUT_DIR, `icon${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Generated icon${size}.png`);
});

console.log("\nAll icons generated in extension/icons/");
console.log("You can replace these with custom icons anytime.");
