const { createCanvas } = require("@napi-rs/canvas");
const {
  drawCoverImage,
  drawVignetteOverlay,
  drawCenteredText,
  drawCircularAvatar,
  roundRect,
  loadImageFromSource,
} = require("../utils/canvas");

const CARD_WIDTH = 908;
const CARD_HEIGHT = 537;
const MAX_TEXT_WIDTH = CARD_WIDTH - 80;

async function createGoodbyeCard(member, cardConfig) {
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  await drawBackground(ctx, cardConfig);
  drawTopBadge(ctx, "Baja registrada");

  const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 256 });
  await drawCircularAvatar(ctx, avatarUrl, CARD_WIDTH / 2, 176, 72, "#f4f4f4", 8);

  const serverName = cardConfig.serverLabel || member.guild.name;
  drawCenteredText(ctx, `Goodbye ${member.user.username}`, 342, 42, "bold", "#ffffff", CARD_WIDTH, MAX_TEXT_WIDTH);
  drawCenteredText(ctx, "from", 390, 26, "bold", "#ffffff", CARD_WIDTH, MAX_TEXT_WIDTH);
  drawCenteredText(ctx, serverName, 430, 30, "bold", "#ffffff", CARD_WIDTH, MAX_TEXT_WIDTH);

  return canvas.toBuffer("image/png");
}

async function drawBackground(ctx, cardConfig) {
  const source = cardConfig.backgroundImage;

  if (source && !source.startsWith("URL_") && !source.startsWith("RUTA_")) {
    try {
      const image = await loadImageFromSource(source);
      drawCoverImage(ctx, image, 0, 0, CARD_WIDTH, CARD_HEIGHT);
      drawVignetteOverlay(ctx, 454, 210, 80, 620, CARD_WIDTH, CARD_HEIGHT);
      return;
    } catch (error) {
      console.warn(`No se pudo cargar el fondo de baja: ${error.message}`);
    }
  }

  drawDefaultBackground(ctx);
}

function drawDefaultBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, "#d8d8d8");
  gradient.addColorStop(0.45, "#8c8c8c");
  gradient.addColorStop(1, "#101010");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const fog = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  fog.addColorStop(0, "rgba(255, 255, 255, 0.18)");
  fog.addColorStop(0.58, "rgba(255, 255, 255, 0.05)");
  fog.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  drawVignetteOverlay(ctx, 454, 210, 80, 620, CARD_WIDTH, CARD_HEIGHT);
}

function drawTopBadge(ctx, text) {
  const width = 330;
  const height = 48;
  const x = (CARD_WIDTH - width) / 2;
  const y = 28;

  ctx.fillStyle = "rgba(20, 20, 20, 0.58)";
  roundRect(ctx, x, y, width, height, 6);
  ctx.fill();

  drawCenteredText(ctx, text, 52, 22, "600", "#ffffff", CARD_WIDTH, width - 24);
}

module.exports = { createGoodbyeCard };
