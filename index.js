require("dotenv").config();

const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} = require("discord.js");

const config = require("./config");
const { getFriendlyErrorMessage } = require("./utils/discord");

const announcementCommand = require("./General Messages/Announcement");
const blacklistCommand = require("./Blacklist/Blacklist");
const nicknameCommand = require("./Nicknames/Nickname");
const recognitionCommand = require("./Recognition/Recognition");
const strikeCommand = require("./Strikes/Strike");
const ticketCommand = require("./Tickets/Ticket");
const welcomeEvent = require("./Welcome - Goodbye/Welcome");
const goodbyeEvent = require("./Welcome - Goodbye/GoodBye");
const testCardCommands = require("./Welcome - Goodbye/TestCards");

if (!process.env.DISCORD_TOKEN) {
  throw new Error("Falta DISCORD_TOKEN en el archivo .env.");
}

// --- Cliente ---

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// --- Registro de comandos ---

client.commands = new Collection();

const commands = [
  announcementCommand,
  blacklistCommand,
  nicknameCommand,
  recognitionCommand,
  strikeCommand,
  ticketCommand,
  // Los comandos de prueba solo se cargan fuera de producción
  ...(process.env.NODE_ENV !== "production" ? testCardCommands : []),
];

for (const command of commands) {
  client.commands.set(command.data.name, command);
}

// --- Registro de handlers de interacciones personalizadas ---
// Cada módulo puede exponer `buttonHandlers` y `modalHandlers`:
// un objeto { [customIdPrefix]: handlerFn(interaction, config) }

const interactionModules = [ticketCommand, nicknameCommand];

const buttonHandlers = new Map();
const modalHandlers = new Map();

for (const mod of interactionModules) {
  if (mod.buttonHandlers) {
    for (const [prefix, handler] of Object.entries(mod.buttonHandlers)) {
      buttonHandlers.set(prefix, handler);
    }
  }
  if (mod.modalHandlers) {
    for (const [prefix, handler] of Object.entries(mod.modalHandlers)) {
      modalHandlers.set(prefix, handler);
    }
  }
}

// --- Evento: ready ---

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot conectado como ${readyClient.user.tag}`);
  console.log(`📦 ${client.commands.size} comandos cargados.`);
});

// --- Evento: interacciones ---

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction, config);
      return;
    }

    if (interaction.isButton()) {
      const handler = resolveHandler(buttonHandlers, interaction.customId);
      if (handler) await handler(interaction, config);
      return;
    }

    if (interaction.isModalSubmit()) {
      const handler = resolveHandler(modalHandlers, interaction.customId);
      if (handler) await handler(interaction, config);
      return;
    }
  } catch (error) {
    console.error(`[InteractionCreate] ${error}`);
    await replyWithError(interaction, getFriendlyErrorMessage(error));
  }
});

// --- Eventos: bienvenida y baja ---

client.on(welcomeEvent.name, (member) => {
  welcomeEvent.execute(member, config).catch(console.error);
});

client.on(goodbyeEvent.name, (member) => {
  goodbyeEvent.execute(member, config).catch(console.error);
});

// --- Helpers ---

/**
 * Busca un handler cuya clave sea prefijo del customId recibido.
 * Permite tanto matches exactos como "ticket:" → "ticket:solicitar-baja".
 * @param {Map<string, Function>} handlers
 * @param {string} customId
 * @returns {Function | undefined}
 */
function resolveHandler(handlers, customId) {
  for (const [prefix, handler] of handlers) {
    if (customId === prefix || customId.startsWith(prefix)) {
      return handler;
    }
  }
  return undefined;
}

async function replyWithError(interaction, message) {
  const payload = { content: message, flags: MessageFlags.Ephemeral };
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch {
    // La interacción puede haber expirado; ignorar silenciosamente.
  }
}

// --- Login ---

client.login(process.env.DISCORD_TOKEN);
