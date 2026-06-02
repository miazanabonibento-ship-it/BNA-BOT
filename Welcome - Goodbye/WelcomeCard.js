const { createCanvas } = require("@napi-rs/canvas");
const {
  drawCoverImage,
  drawVignetteOverlay,
  drawCenteredText,
  drawCircularAvatar,
  roundRect,
  loadImageFromSource,
} = require("../utils/canvas");

const CARD_WIDTH = 397;
const CARD_HEIGHT = 257;
const MAX_TEXT_WIDTH = CARD_WIDTH - 28;

async function createWelcomeCard(member, cardConfig) {
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  await drawBackground(ctx, cardConfig);
  drawTopBadge(ctx, `Member #${member.guild.memberCount}`);

  const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 256 });
  await drawCircularAvatar(ctx, avatarUrl, CARD_WIDTH / 2, 98, 54, "#ffffff", 6);

  const serverName = cardConfig.serverLabel || member.guild.name;
  drawCenteredText(ctx, `Welcome ${member.user.username}`, 187, 24, "bold", "#ffffff", CARD_WIDTH, MAX_TEXT_WIDTH);
  drawCenteredText(ctx, "to", 209, 17, "bold", "#ffffff", CARD_WIDTH, MAX_TEXT_WIDTH);
  drawCenteredText(ctx, serverName, 229, 18, "bold", "#ffffff", CARD_WIDTH, MAX_TEXT_WIDTH);

  return canvas.toBuffer("image/png");
}

async function drawBackground(ctx, cardConfig) {
  const source = cardConfig.backgroundImage;

  if (source && !source.startsWith("URL_") && !source.startsWith("RUTA_")) {
    try {
      const image = await loadImageFromSource(source);
      drawCoverImage(ctx, image, 0, 0, CARD_WIDTH, CARD_HEIGHT);
      drawVignetteOverlay(ctx, 198, 112, 40, 260, CARD_WIDTH, CARD_HEIGHT, {
        inner: "rgba(0, 0, 0, 0.05)",
        outer: "rgba(0, 0, 0, 0.45)",
      });
      return;
    } catch (error) {
      console.warn(`No se pudo cargar el fondo de bienvenida: ${error.message}`);
    }
  }

  drawDefaultFlagBackground(ctx);
}

function drawDefaultFlagBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, "#113a78");
  gradient.addColorStop(0.5, "#f2f2f2");
  gradient.addColorStop(1, "#0e3470");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = "rgba(40, 92, 164, 0.8)";
  ctx.fillRect(0, 0, CARD_WIDTH, 86);
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.fillRect(0, 86, CARD_WIDTH, 85);
  ctx.fillStyle = "rgba(36, 92, 166, 0.86)";
  ctx.fillRect(0, 171, CARD_WIDTH, 86);

  // Textura de ruido sutil
  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  for (let i = 0; i < 900; i += 1) {
    ctx.fillRect(Math.random() * CARD_WIDTH, Math.random() * CARD_HEIGHT, Math.random() * 1.6, Math.random() * 1.6);
  }

  drawVignetteOverlay(ctx, 198, 120, 50, 260, CARD_WIDTH, CARD_HEIGHT, {
    inner: "rgba(0, 0, 0, 0)",
    outer: "rgba(0, 0, 0, 0.48)",
  });
}

function drawTopBadge(ctx, text) {
  const width = 230;
  const height = 25;
  const x = (CARD_WIDTH - width) / 2;
  const y = 8;

  ctx.fillStyle = "rgba(70, 78, 95, 0.72)";
  roundRect(ctx, x, y, width, height, 4);
  ctx.fill();

  drawCenteredText(ctx, text, 26, 14, "600", "#ffffff", CARD_WIDTH, width - 16);
}

module.exports = { createWelcomeCard };
