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
const { getBotMember, getMissingPermissions, EMBED_PERMISSIONS } = require("../utils/discord");

// Custom IDs de los botones de gestión
const BTN_TAKE    = "ticket-action:take";
const BTN_RELEASE = "ticket-action:release";
const BTN_CLOSE   = "ticket-action:close";
const BTN_DELETE  = "ticket-action:delete";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-panel")
    .setDescription("Envía el panel para crear tickets.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal donde se enviará el panel. Si no elegís uno, se envía acá.")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),

  buttonHandlers: {
    "ticket:":        handleTicketButton,   // Crear ticket desde el panel
    "ticket-action:": handleTicketAction,   // Tomar / Liberar / Cerrar / Eliminar
  },

  async execute(interaction, config) {
    const targetChannel = interaction.options.getChannel("canal") ?? interaction.channel;

    if (!targetChannel?.isTextBased()) {
      return interaction.reply({ content: "Ese canal no sirve para enviar el panel de tickets.", flags: MessageFlags.Ephemeral });
    }

    const botMember = await getBotMember(interaction.guild);
    const missing = getMissingPermissions(targetChannel, botMember, EMBED_PERMISSIONS);

    if (missing.length > 0) {
      return interaction.reply({
        content: `No puedo mandar el panel en ${targetChannel}. Me faltan: ${missing.join(", ")}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.tickets)
      .setTitle(config.tickets.panelTitle)
      .setDescription(config.tickets.panelDescription)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      config.tickets.buttons.slice(0, 4).map((button) =>
        new ButtonBuilder()
          .setCustomId(`ticket:${button.id}`)
          .setLabel(button.label)
          .setEmoji(button.emoji)
          .setStyle(ButtonStyle[button.style] ?? ButtonStyle.Primary)
      )
    );

    await targetChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `Panel de tickets enviado en ${targetChannel}.`, flags: MessageFlags.Ephemeral });
  },
};

// ─── Crear ticket ────────────────────────────────────────────────────────────

async function handleTicketButton(interaction, config) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const ticketTypeId = interaction.customId.replace("ticket:", "");
  const ticketType = config.tickets.buttons.find((b) => b.id === ticketTypeId);

  if (!ticketType) {
    return interaction.editReply("Este tipo de ticket ya no está configurado.");
  }

  const botMember = await getBotMember(interaction.guild);

  if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.editReply("No puedo crear tickets porque me falta el permiso Gestionar canales.");
  }

  const existingChannel = interaction.guild.channels.cache.find(
    (ch) => ch.topic === `ticket-owner:${interaction.user.id}` && ch.name.includes(ticketType.id)
  );

  if (existingChannel) {
    return interaction.editReply(`Ya tenés un ticket abierto de este tipo: ${existingChannel}.`);
  }

  const permissionOverwrites = buildPermissionOverwrites(interaction, config);
  const channelName = normalizeChannelName(`ticket-${ticketType.id}-${interaction.user.username}`);
  const categoryId = await getValidCategoryId(interaction, config);

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    topic: `ticket-owner:${interaction.user.id}`,
    permissionOverwrites,
    ...(categoryId && { parent: categoryId }),
  });

  const embed = new EmbedBuilder()
    .setColor(config.colors.tickets)
    .setTitle(`${ticketType.emoji || ""} Ticket creado`.trim())
    .setDescription(`${interaction.user}, gracias por abrir un ticket. El equipo te responderá pronto.`)
    .addFields(
      { name: "Tipo", value: ticketType.label, inline: true },
      { name: "Usuario", value: `${interaction.user}`, inline: true },
      { name: "Estado", value: "🟡 Sin atender", inline: true }
    )
    .setTimestamp();

  await channel.send({
    content: `${interaction.user}`,
    embeds: [embed],
    components: [buildActionRow(false)],  // false = no tomado aún
  });

  await interaction.editReply(`Ticket creado: ${channel}.`);
}

// ─── Gestión del ticket (Tomar / Liberar / Cerrar / Eliminar) ─────────────────

async function handleTicketAction(interaction, config) {
  const action = interaction.customId.replace("ticket-action:", "");
  const channel = interaction.channel;

  // Verificar que quien actúa es staff (tiene rol autorizado)
  const isStaff = isAuthorizedStaff(interaction, config);
  if (!isStaff) {
    return interaction.reply({ content: "No tenés permisos para gestionar tickets.", flags: MessageFlags.Ephemeral });
  }

  if (action === "take") {
    await handleTake(interaction, channel);
  } else if (action === "release") {
    await handleRelease(interaction, channel);
  } else if (action === "close") {
    await handleClose(interaction, channel);
  } else if (action === "delete") {
    await handleDelete(interaction, channel);
  }
}

async function handleTake(interaction, channel) {
  await interaction.deferUpdate();

  // Renombrar canal agregando el username del staff
  const baseName = channel.name.replace(/-[^-]+$/, ""); // quita sufijo anterior si existe
  const newName = normalizeChannelName(`${baseName}-${interaction.user.username}`);

  await channel.setName(newName, `Tomado por ${interaction.user.tag}`);

  // Actualizar el embed original con el nuevo estado
  const originalMessage = interaction.message;
  const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
    .spliceFields(2, 1, { name: "Estado", value: `🟢 Atendido por ${interaction.user}`, inline: true });

  await originalMessage.edit({
    embeds: [updatedEmbed],
    components: [buildActionRow(true, interaction.user.id)], // true = tomado
  });

  await channel.send(`✅ ${interaction.user} tomó el ticket.`);
}

async function handleRelease(interaction, channel) {
  await interaction.deferUpdate();

  // Restaurar nombre sin el sufijo del staff
  const newName = normalizeChannelName(channel.name.replace(/-[^-]+$/, ""));
  await channel.setName(newName, `Liberado por ${interaction.user.tag}`);

  const originalMessage = interaction.message;
  const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
    .spliceFields(2, 1, { name: "Estado", value: "🟡 Sin atender", inline: true });

  await originalMessage.edit({
    embeds: [updatedEmbed],
    components: [buildActionRow(false)],
  });

  await channel.send(`🔄 ${interaction.user} liberó el ticket.`);
}

async function handleClose(interaction, channel) {
  await interaction.deferUpdate();

  // Obtener el ID del dueño del ticket desde el topic
  const ownerId = channel.topic?.replace("ticket-owner:", "");

  // Bloquear al usuario dueño del ticket
  if (ownerId) {
    await channel.permissionOverwrites.edit(ownerId, {
      [PermissionFlagsBits.SendMessages]: false,
    }).catch(() => null);
  }

  const originalMessage = interaction.message;
  const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
    .setColor(0x95a5a6)
    .spliceFields(2, 1, { name: "Estado", value: "🔴 Cerrado", inline: true });

  // Al cerrar solo queda el botón eliminar
  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BTN_DELETE)
      .setLabel("Eliminar")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
  );

  await originalMessage.edit({ embeds: [updatedEmbed], components: [closeRow] });
  await channel.send(`🔒 Ticket cerrado por ${interaction.user}. Solo el staff puede eliminarlo.`);
}

async function handleDelete(interaction, channel) {
  await interaction.reply({ content: "Eliminando canal en 3 segundos...", flags: MessageFlags.Ephemeral });
  await sleep(3000);
  await channel.delete(`Eliminado por ${interaction.user.tag}`).catch(() => null);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Construye la fila de botones de gestión del ticket.
 * @param {boolean} taken - si el ticket ya fue tomado
 * @param {string} [takenById] - ID del staff que lo tomó (no usado actualmente, reservado)
 */
function buildActionRow(taken, takenById) {
  const row = new ActionRowBuilder();

  if (taken) {
    row.addComponents(
      new ButtonBuilder().setCustomId(BTN_RELEASE).setLabel("Liberar").setEmoji("🔄").setStyle(ButtonStyle.Secondary)
    );
  } else {
    row.addComponents(
      new ButtonBuilder().setCustomId(BTN_TAKE).setLabel("Tomar").setEmoji("✋").setStyle(ButtonStyle.Success)
    );
  }

  row.addComponents(
    new ButtonBuilder().setCustomId(BTN_CLOSE).setLabel("Cerrar").setEmoji("🔒").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN_DELETE).setLabel("Eliminar").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
  );

  return row;
}

function isAuthorizedStaff(interaction, config) {
  const authorizedRoles = config.tickets.authorizedRoleIds.filter((id) => id && !id.startsWith("ID_"));
  if (authorizedRoles.length === 0) {
    return interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) ?? false;
  }
  return interaction.member.roles.cache.some((role) => authorizedRoles.includes(role.id));
}

function buildPermissionOverwrites(interaction, config) {
  const authorizedRoles = config.tickets.authorizedRoleIds.filter((id) => id && !id.startsWith("ID_"));

  return [
    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
    ...authorizedRoles.map((roleId) => ({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    })),
  ];
}

async function getValidCategoryId(interaction, config) {
  const categoryId = config.tickets.categoryId;
  if (!categoryId || categoryId.startsWith("ID_")) return null;

  const category = await interaction.guild.channels.fetch(categoryId).catch(() => null);

  if (!category) {
    console.warn("La categoría de tickets configurada no existe. El ticket se creará sin categoría.");
    return null;
  }

  if (category.type !== ChannelType.GuildCategory) {
    console.warn("tickets.categoryId no es una categoría. El ticket se creará sin categoría.");
    return null;
  }

  return category.id;
}

function normalizeChannelName(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
