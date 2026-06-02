require("dotenv").config();

const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes
} = require("discord.js");

const config = require("./config");
const announcementCommand = require("./General Messages/Announcement");
const blacklistCommand = require("./Blacklist/Blacklist");
const nicknameCommand = require("./Nicknames/Nickname");
const recognitionCommand = require("./Recognition/Recognition");
const strikeCommand = require("./Strikes/Strike");
const ticketCommand = require("./Tickets/Ticket");
const welcomeEvent = require("./Welcome - Goodbye/Welcome");
const goodbyeEvent = require("./Welcome - Goodbye/GoodBye");
const testCardCommands = require("./Welcome - Goodbye/TestCards");

// Inicializa el cliente de Discord.js con los intents necesarios
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// Cargar todos los comandos
const commands = [
  announcementCommand,
  blacklistCommand,
  nicknameCommand,
  recognitionCommand,
  strikeCommand,
  ticketCommand,
  ...testCardCommands
];

for (const command of commands) {
  if (!command.data || !command.data.name) {
    console.warn("⚠️ Un comando no tiene estructura valida", command);
    continue;
  }
  client.commands.set(command.data.name, command);
  console.log(`✅ Comando cargado: ${command.data.name}`);
}

// Evento cuando el bot está listo
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`\n✅ Bot conectado como ${readyClient.user.tag}`);
  console.log(`📊 Servidores: ${readyClient.guilds.cache.size}`);
  try {
    await registerCommands();
  } catch (error) {
    console.error("❌ Error registrando comandos:", error);
  }
});

// Maneja todas las interacciones (comandos, botones, modales)
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    const interactionType = interaction.isChatInputCommand() 
      ? `Comando: ${interaction.commandName}`
      : interaction.isButton()
      ? `Botón: ${interaction.customId}`
      : interaction.isModalSubmit()
      ? `Modal: ${interaction.customId}`
      : "Desconocida";

    console.log(`📨 Interacción: ${interaction.user.tag} → ${interactionType}`);

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.warn(`⚠️ Comando no encontrado: ${interaction.commandName}`);
        return;
      }

      await command.execute(interaction, config);
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("ticket:")) {
      await ticketCommand.handleButton(interaction, config);
      return;
    }

    // Manejo de acciones dentro del ticket (cerrar, eliminar, tomar)
    if (interaction.isButton() && (
      interaction.customId.startsWith("ticket-claim:") ||
      interaction.customId.startsWith("ticket-close:") ||
      interaction.customId.startsWith("ticket-delete:")
    )) {
      await ticketCommand.handleTicketAction(interaction, config);
      return;
    }

    if (interaction.isButton() && interaction.customId === nicknameCommand.customIds.openModal) {
      await nicknameCommand.handleButton(interaction, config);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === nicknameCommand.customIds.submitModal) {
      await nicknameCommand.handleModal(interaction, config);
    }
  } catch (error) {
    console.error(`❌ Error procesando interacción de ${interaction.user.tag}:`, error);

    const response = {
      content: getFriendlyErrorMessage(error),
      ephemeral: true
    };

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(response);
      } else {
        await interaction.reply(response);
      }
    } catch (replyError) {
      console.error("❌ Error enviando respuesta de error:", replyError);
    }
  }
});

// Evento de bienvenida cuando un miembro se une
client.on(welcomeEvent.name, (member) => {
  console.log(`👋 Bienvenida: ${member.user.tag} se unió a ${member.guild.name}`);
  welcomeEvent.execute(member, config).catch((error) => {
    console.error(`❌ Error en evento de bienvenida (${member.user.tag}):`, error);
  });
});

// Evento de despedida cuando un miembro se va
client.on(goodbyeEvent.name, (member) => {
  console.log(`👋 Despedida: ${member.user.tag} abandonó ${member.guild.name}`);
  goodbyeEvent.execute(member, config).catch((error) => {
    console.error(`❌ Error en evento de despedida (${member.user.tag}):`, error);
  });
});

// Registra todos los comandos slash en Discord
async function registerCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId || !guildId) {
    console.warn("⚠️ Faltan variables: DISCORD_TOKEN, CLIENT_ID o GUILD_ID");
    return;
  }

  try {
    const rest = new REST({ version: "10" }).setToken(token);
    const commandPayload = commands.map((command) => command.data.toJSON());

    console.log(`📝 Registrando ${commandPayload.length} comandos...`);
    
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commandPayload }
    );

    console.log(`✅ ${commandPayload.length} comandos registrados exitosamente`);
  } catch (error) {
    console.error("❌ Error registrando comandos:", error.message);
    throw error;
  }
}

// Conecta el bot con manejo de errores
if (!process.env.DISCORD_TOKEN) {
  throw new Error("❌ DISCORD_TOKEN no está configurado en .env");
}

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error("❌ Error al conectar el bot:", error.message);
  process.exit(1);
});

// Convierte códigos de error de Discord en mensajes amigables
function getFriendlyErrorMessage(error) {
  const errorMessages = {
    50001: "No tengo acceso a ese canal. Revisame permisos de Ver canal, Enviar mensajes e Insertar enlaces.",
    50013: "Me faltan permisos para hacer esa acción. Revisame el rol del bot y los permisos del canal.",
    50035: "Discord rechazó los datos enviados. Revisame IDs de canales/categorías/roles en config.js.",
    50018: "El bot está inactivo o falta la autorización OAuth2."
  };

  return errorMessages[error?.code] || "Ocurrió un error ejecutando esta acción.";
}
