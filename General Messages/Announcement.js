const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
const { getBotMember, getMissingPermissions, normalizeRoleIds } = require("../utils/discord");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("anuncio")
    .setDescription("Envía un mensaje importante con formato embed.")
    .addStringOption((o) => o.setName("titulo").setDescription("Título del anuncio.").setMaxLength(240).setRequired(true))
    .addStringOption((o) => o.setName("mensaje").setDescription("Contenido del anuncio.").setMaxLength(3800).setRequired(true))
    .addChannelOption((o) =>
      o.setName("canal").setDescription("Canal donde se enviará el anuncio. Si no elegís uno, se envía acá.")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(false)
    )
    .addStringOption((o) =>
      o.setName("plantilla").setDescription("Plantilla visual para el anuncio.").setRequired(false)
        .addChoices(
          { name: "Comunicado oficial", value: "official" },
          { name: "Operativo", value: "operation" },
          { name: "Evento", value: "event" },
          { name: "Mantenimiento", value: "maintenance" },
          { name: "Urgente", value: "urgent" },
          { name: "Ascenso / reconocimiento", value: "promotion" }
        )
    )
    .addStringOption((o) => o.setName("color").setDescription("Color hexadecimal, por ejemplo #2F80ED.").setRequired(false))
    .addStringOption((o) =>
      o.setName("estilo").setDescription("Estilo visual rápido para el anuncio.").setRequired(false)
        .addChoices(
          { name: "Información", value: "info" },
          { name: "Importante", value: "important" },
          { name: "Éxito", value: "success" },
          { name: "Alerta", value: "warning" },
          { name: "Error", value: "danger" }
        )
    )
    .addStringOption((o) => o.setName("imagen").setDescription("URL de una imagen opcional.").setMaxLength(2048).setRequired(false))
    .addStringOption((o) => o.setName("miniatura").setDescription("URL de una miniatura opcional.").setMaxLength(2048).setRequired(false))
    .addStringOption((o) => o.setName("autor").setDescription("Texto opcional para mostrar arriba del embed.").setMaxLength(200).setRequired(false))
    .addStringOption((o) => o.setName("pie").setDescription("Texto opcional para el pie del embed.").setMaxLength(1800).setRequired(false))
    .addStringOption((o) => o.setName("campo_1_titulo").setDescription("Título del primer campo extra.").setMaxLength(256).setRequired(false))
    .addStringOption((o) => o.setName("campo_1_texto").setDescription("Texto del primer campo extra.").setMaxLength(1024).setRequired(false))
    .addStringOption((o) => o.setName("campo_2_titulo").setDescription("Título del segundo campo extra.").setMaxLength(256).setRequired(false))
    .addStringOption((o) => o.setName("campo_2_texto").setDescription("Texto del segundo campo extra.").setMaxLength(1024).setRequired(false))
    .addStringOption((o) => o.setName("campo_3_titulo").setDescription("Título del tercer campo extra.").setMaxLength(256).setRequired(false))
    .addStringOption((o) => o.setName("campo_3_texto").setDescription("Texto del tercer campo extra.").setMaxLength(1024).setRequired(false))
    .addStringOption((o) => o.setName("boton_texto").setDescription("Texto de un botón con link.").setMaxLength(80).setRequired(false))
    .addStringOption((o) => o.setName("boton_url").setDescription("URL del botón con link.").setMaxLength(2048).setRequired(false))
    .addRoleOption((o) => o.setName("mencionar_rol").setDescription("Rol opcional para mencionar junto al anuncio.").setRequired(false))
    .addBooleanOption((o) => o.setName("mencionar_todos").setDescription("Mencionar @everyone junto al anuncio.").setRequired(false))
    .addBooleanOption((o) => o.setName("fijar").setDescription("Fijar el anuncio después de enviarlo.").setRequired(false))
    .addBooleanOption((o) => o.setName("mostrar_fecha").setDescription("Mostrar fecha y hora en el embed.").setRequired(false)),

  async execute(interaction, config) {
    const title = interaction.options.getString("titulo", true);
    const message = interaction.options.getString("mensaje", true);
    const targetChannel = interaction.options.getChannel("canal") ?? interaction.channel;
    const template = interaction.options.getString("plantilla");
    const colorInput = interaction.options.getString("color");
    const style = interaction.options.getString("estilo");
    const imageUrl = interaction.options.getString("imagen");
    const thumbnailUrl = interaction.options.getString("miniatura");
    const authorText = interaction.options.getString("autor");
    const footerText = interaction.options.getString("pie");
    const roleMention = interaction.options.getRole("mencionar_rol");
    const mentionEveryone = interaction.options.getBoolean("mencionar_todos") ?? false;
    const buttonText = interaction.options.getString("boton_texto");
    const buttonUrl = interaction.options.getString("boton_url");
    const pinMessage = interaction.options.getBoolean("fijar") ?? false;
    const showTimestamp = interaction.options.getBoolean("mostrar_fecha") ?? true;

    // --- Validaciones ---

    if (!canUseAnnouncementCommand(interaction, config.announcements)) {
      return interaction.reply({ content: "No tenés un rol autorizado para usar /anuncio.", flags: MessageFlags.Ephemeral });
    }

    if (mentionEveryone && !config.announcements?.allowEveryoneMention) {
      return interaction.reply({ content: "La mención @everyone está desactivada en config.js para /anuncio.", flags: MessageFlags.Ephemeral });
    }

    if (roleMention && !canMentionRole(roleMention.id, config.announcements)) {
      return interaction.reply({
        content: "Ese rol no está autorizado para mencionarse con /anuncio. Agregalo en config.js > announcements.mentionableRoleIds.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if ((buttonText && !buttonUrl) || (!buttonText && buttonUrl)) {
      return interaction.reply({ content: "Para agregar botón tenés que completar boton_texto y boton_url.", flags: MessageFlags.Ephemeral });
    }

    for (const [value, label] of [[buttonUrl, "URL del botón"], [imageUrl, "imagen"], [thumbnailUrl, "miniatura"]]) {
      if (value && !isValidHttpUrl(value)) {
        return interaction.reply({ content: `La ${label} tiene que ser una URL válida que empiece con http:// o https://.`, flags: MessageFlags.Ephemeral });
      }
    }

    if (!targetChannel?.isTextBased()) {
      return interaction.reply({ content: "Ese canal no sirve para enviar anuncios.", flags: MessageFlags.Ephemeral });
    }

    const botMember = await getBotMember(interaction.guild);
    const requiredPerms = [
      [PermissionFlagsBits.ViewChannel, "Ver canal"],
      [PermissionFlagsBits.SendMessages, "Enviar mensajes"],
      [PermissionFlagsBits.EmbedLinks, "Insertar enlaces"],
      ...(pinMessage ? [[PermissionFlagsBits.ManageMessages, "Gestionar mensajes"]] : []),
    ];
    const missing = getMissingPermissions(targetChannel, botMember, requiredPerms);

    if (missing.length > 0) {
      return interaction.reply({
        content: `No puedo mandar el anuncio en ${targetChannel}. Me faltan: ${missing.join(", ")}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // --- Construcción del embed ---

    const templateConfig = getTemplateConfig(template);
    const color = parseColor(colorInput) ?? getStyleColor(style) ?? templateConfig.color ?? config.colors.announcements;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(formatTitle(title, templateConfig))
      .setDescription(formatDescription(message, templateConfig))
      .setFooter({
        text: footerText ?? getDefaultFooter(interaction, templateConfig),
        iconURL: interaction.user.displayAvatarURL(),
      });

    if (showTimestamp) embed.setTimestamp();
    if (authorText) embed.setAuthor({ name: authorText, iconURL: interaction.guild.iconURL() ?? interaction.client.user.displayAvatarURL() });
    if (imageUrl) embed.setImage(imageUrl);
    if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

    const fields = getCustomFields(interaction);
    if (fields.length > 0) embed.addFields(fields);

    // --- Envío ---

    const sentMessage = await targetChannel.send({
      content: getAnnouncementContent(roleMention, mentionEveryone),
      embeds: [embed],
      components: getComponents(buttonText, buttonUrl),
      allowedMentions: getAllowedMentions(roleMention, mentionEveryone),
    });

    if (pinMessage) {
      await sentMessage.pin(`Anuncio fijado por ${interaction.user.tag}`);
    }

    await interaction.reply({ content: `Anuncio enviado en ${targetChannel}.`, flags: MessageFlags.Ephemeral });
  },
};

// --- Helpers privados ---

function parseColor(value) {
  if (!value) return null;
  const clean = value.replace("#", "").trim();
  return /^[0-9a-fA-F]{6}$/.test(clean) ? Number.parseInt(clean, 16) : null;
}

function getTemplateConfig(template) {
  const templates = {
    official:    { icon: "📢", label: "Comunicado oficial",  color: 0x2f80ed, accent: "Comunicado emitido por el staff." },
    operation:   { icon: "🛡️", label: "Operativo",           color: 0x27ae60, accent: "Información operativa para la comunidad." },
    event:       { icon: "📅", label: "Evento",               color: 0xf39c12, accent: "Actividad programada." },
    maintenance: { icon: "🛠️", label: "Mantenimiento",       color: 0x95a5a6, accent: "Aviso técnico o de organización." },
    urgent:      { icon: "🚨", label: "Urgente",              color: 0xe74c3c, accent: "Este aviso requiere atención inmediata." },
    promotion:   { icon: "⭐", label: "Reconocimiento",       color: 0x9b59b6, accent: "Felicitaciones y reconocimiento oficial." },
  };
  return templates[template] ?? {};
}

function formatTitle(title, t) {
  return t.icon ? `${t.icon} ${title}` : title;
}

function formatDescription(message, t) {
  return t.accent ? `**${t.accent}**\n\n${message}` : message;
}

function getDefaultFooter(interaction, t) {
  const label = t.label ? `${t.label} | ` : "";
  return `${label}Publicado por ${interaction.user.tag}`;
}

function getStyleColor(style) {
  const colors = { info: 0x2f80ed, important: 0x8e44ad, success: 0x2ecc71, warning: 0xf1c40f, danger: 0xd64545 };
  return colors[style] ?? null;
}

function getAnnouncementContent(roleMention, mentionEveryone) {
  const parts = [];
  if (mentionEveryone) parts.push("@everyone");
  if (roleMention) parts.push(`${roleMention}`);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function getCustomFields(interaction) {
  const fields = [];
  for (let i = 1; i <= 3; i++) {
    const name = interaction.options.getString(`campo_${i}_titulo`);
    const value = interaction.options.getString(`campo_${i}_texto`);
    if (!name && !value) continue;
    fields.push({
      name: trimDiscordText(name ?? `Detalle ${i}`, 256),
      value: trimDiscordText(value ?? "No especificado.", 1024),
      inline: true,
    });
  }
  return fields;
}

function getComponents(buttonText, buttonUrl) {
  if (!buttonText || !buttonUrl) return [];
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel(buttonText).setStyle(ButtonStyle.Link).setURL(buttonUrl)
    ),
  ];
}

function getAllowedMentions(roleMention, mentionEveryone) {
  const result = { parse: mentionEveryone ? ["everyone"] : [] };
  if (roleMention) result.roles = [roleMention.id];
  return result;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function trimDiscordText(value, maxLength) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function canUseAnnouncementCommand(interaction, announcementsConfig = {}) {
  const allowed = normalizeRoleIds(announcementsConfig.allowedCommandRoleIds);
  if (allowed.length === 0) return interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) ?? false;
  return interaction.member.roles.cache.some((role) => allowed.includes(role.id));
}

function canMentionRole(roleId, announcementsConfig = {}) {
  const allowed = normalizeRoleIds(announcementsConfig.mentionableRoleIds);
  return allowed.length === 0 || allowed.includes(roleId);
}
