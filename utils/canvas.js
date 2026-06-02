const fs = require("node:fs/promises");
const path = require("node:path");
const { loadImage } = require("@napi-rs/canvas");

/**
 * Dibuja una imagen cubriendo el área dada (comportamiento cover de CSS).
 * @param {import("@napi-rs/canvas").SKRSContext2D} ctx
 * @param {import("@napi-rs/canvas").Image} image
 */
function drawCoverImage(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  const offsetX = x + (width - scaledWidth) / 2;
  const offsetY = y + (height - scaledHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);
}

/**
 * Dibuja un overlay tipo viñeta radial oscura.
 * @param {import("@napi-rs/canvas").SKRSContext2D} ctx
 * @param {number} cx - centro X del gradiente
 * @param {number} cy - centro Y del gradiente
 * @param {number} innerRadius
 * @param {number} outerRadius
 * @param {number} cardWidth
 * @param {number} cardHeight
 * @param {{ inner?: string, outer?: string }} [colors]
 */
function drawVignetteOverlay(ctx, cx, cy, innerRadius, outerRadius, cardWidth, cardHeight, colors = {}) {
  const vignette = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
  vignette.addColorStop(0, colors.inner ?? "rgba(0, 0, 0, 0.08)");
  vignette.addColorStop(1, colors.outer ?? "rgba(0, 0, 0, 0.58)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, cardWidth, cardHeight);
}

/**
 * Dibuja texto centrado horizontalmente con sombra y truncado automático.
 * @param {import("@napi-rs/canvas").SKRSContext2D} ctx
 * @param {string} text
 * @param {number} y
 * @param {number} size - tamaño de fuente en px
 * @param {string} weight - "bold", "600", etc.
 * @param {string} color - color CSS
 * @param {number} cardWidth
 * @param {number} maxWidth
 */
function drawCenteredText(ctx, text, y, size, weight, color, cardWidth, maxWidth) {
  ctx.font = `${weight} ${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  let output = text;
  while (ctx.measureText(output).width > maxWidth && output.length > 3) {
    output = `${output.slice(0, -4)}...`;
  }

  ctx.fillText(output, cardWidth / 2, y);
  ctx.shadowColor = "transparent";
}

/**
 * Dibuja un avatar circular con borde blanco.
 * @param {import("@napi-rs/canvas").SKRSContext2D} ctx
 * @param {string} avatarUrl
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {string} [borderColor="#ffffff"]
 * @param {number} [borderSize=6]
 */
async function drawCircularAvatar(ctx, avatarUrl, centerX, centerY, radius, borderColor = "#ffffff", borderSize = 6) {
  const avatar = await loadImageFromSource(avatarUrl);

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + borderSize, 0, Math.PI * 2);
  ctx.fillStyle = borderColor;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();
}

/**
 * Dibuja un rectángulo con esquinas redondeadas (path, sin fill/stroke).
 * @param {import("@napi-rs/canvas").SKRSContext2D} ctx
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Carga una imagen desde una URL http/https o desde una ruta local.
 * @param {string} source
 * @returns {Promise<import("@napi-rs/canvas").Image>}
 */
async function loadImageFromSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return loadImage(Buffer.from(arrayBuffer));
  }

  const absolutePath = path.isAbsolute(source)
    ? source
    : path.join(process.cwd(), source);
  const file = await fs.readFile(absolutePath);
  return loadImage(file);
}

module.exports = {
  drawCoverImage,
  drawVignetteOverlay,
  drawCenteredText,
  drawCircularAvatar,
  roundRect,
  loadImageFromSource,
};
