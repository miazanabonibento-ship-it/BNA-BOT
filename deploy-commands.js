/**
 * deploy-commands.js
 *
 * Registra los slash commands en Discord.
 * Ejecutar manualmente solo cuando se agregan o modifican comandos:
 *
 *   node deploy-commands.js
 *
 * No se ejecuta automáticamente al iniciar el bot.
 */

require("dotenv").config();

const { REST, Routes } = require("discord.js");

const announcementCommand = require("./General Messages/Announcement");
const blacklistCommand = require("./Blacklist/Blacklist");
const nicknameCommand = require("./Nicknames/Nickname");
const recognitionCommand = require("./Recognition/Recognition");
const strikeCommand = require("./Strikes/Strike");
const ticketCommand = require("./Tickets/Ticket");
const testCardCommands = require("./Welcome - Goodbye/TestCards");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ Faltan DISCORD_TOKEN, CLIENT_ID o GUILD_ID en el archivo .env.");
  process.exit(1);
}

const allCommands = [
  announcementCommand,
  blacklistCommand,
  nicknameCommand,
  recognitionCommand,
  strikeCommand,
  ticketCommand,
  ...testCardCommands,
];

const commandPayload = allCommands.map((command) => command.data.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`📡 Registrando ${commandPayload.length} comandos slash...`);

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commandPayload,
    });

    console.log("✅ Comandos slash registrados correctamente.");
  } catch (error) {
    console.error("❌ Error al registrar comandos:", error);
    process.exit(1);
  }
})();
