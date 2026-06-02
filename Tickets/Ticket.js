const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require("discord.js");
const { getBotMember, getMissingPermissions, EMBED_PERMISSIONS } = require("../utils/discord");

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

  // Dispatcher dinámico: prefijo "ticket:" captura todos los botones del panel
  buttonHandlers: {
    "ticket:": handleTicketButton,
  },

  async execute(interaction, config) {
    const targetChannel = interaction.options.getChannel("canal") ?? interaction.channel;

    if (!targetChannel?.isTextBased()) {
      return interaction.reply({ content: "Ese canal no sirve para enviar el panel de tickets.", ephemeral: true });
    }

    const botMember = await getBotMember(interaction.guild);
    const missing = getMissingPermissions(targetChannel, botMember, EMBED_PERMISSIONS);

    if (missing.length > 0) {
      return interaction.reply({
        content: `No puedo mandar el panel en ${targetChannel}. Me faltan: ${missing.join(", ")}.`,
        ephemeral: true,
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
    await interaction.reply({ content: `Panel de tickets enviado en ${targetChannel}.`, ephemeral: true });
  },
};

async function handleTicketButton(interaction, config) {
  await interaction.deferReply({ ephemeral: true });

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

  const channelOptions = {
    name: channelName,
    type: ChannelType.GuildText,
    topic: `ticket-owner:${interaction.user.id}`,
    permissionOverwrites,
    ...(categoryId && { parent: categoryId }),
  };

  const channel = await interaction.guild.channels.create(channelOptions);

  const embed = new EmbedBuilder()
    .setColor(config.colors.tickets)
    .setTitle(`${ticketType.emoji || ""} Ticket creado`.trim())
    .setDescription(`${interaction.user}, gracias por abrir un ticket. El equipo autorizado te responderá pronto.`)
    .addFields(
      { name: "Tipo", value: ticketType.label, inline: true },
      { name: "Usuario", value: `${interaction.user}`, inline: true }
    )
    .setTimestamp();

  await channel.send({ content: `${interaction.user}`, embeds: [embed] });
  await interaction.editReply(`Ticket creado: ${channel}.`);
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
