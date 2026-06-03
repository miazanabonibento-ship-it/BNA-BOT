const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { getBotMember } = require("../utils/discord");

const OPEN_MODAL_ID = "nickname:open";
const SUBMIT_MODAL_ID = "nickname:submit";
const INPUT_ID = "nickname:value";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("apodo-panel")
    .setDescription("Envía el panel para que los usuarios puedan cambiarse el apodo.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal donde se enviará el panel. Si no elegís uno, se envía acá.")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),

  buttonHandlers: {
    [OPEN_MODAL_ID]: handleOpenModal,
  },
  modalHandlers: {
    [SUBMIT_MODAL_ID]: handleModalSubmit,
  },

  async execute(interaction, config) {
    const targetChannel = interaction.options.getChannel("canal") ?? interaction.channel;

    if (!targetChannel?.isTextBased()) {
      return interaction.reply({ content: "Ese canal no sirve para enviar el panel de apodos.", flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.nicknames)
      .setTitle(config.nicknames.panelTitle)
      .setDescription(config.nicknames.panelDescription)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(OPEN_MODAL_ID)
        .setLabel(config.nicknames.button.label)
        .setEmoji(config.nicknames.button.emoji)
        .setStyle(ButtonStyle[config.nicknames.button.style] ?? ButtonStyle.Primary)
    );

    await targetChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `Panel de apodos enviado en ${targetChannel}.`, flags: MessageFlags.Ephemeral });
  },
};

async function handleOpenModal(interaction) {
  const modal = new ModalBuilder().setCustomId(SUBMIT_MODAL_ID).setTitle("Cambiar apodo");

  const nicknameInput = new TextInputBuilder()
    .setCustomId(INPUT_ID)
    .setLabel("Nuevo apodo")
    .setPlaceholder("Escribí tu nuevo apodo")
    .setMinLength(1)
    .setMaxLength(32)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(nicknameInput));
  await interaction.showModal(modal);
}

async function handleModalSubmit(interaction, config) {
  const nickname = interaction.fields.getTextInputValue(INPUT_ID).trim();

  if (!nickname) {
    return interaction.reply({ content: "El apodo no puede estar vacío.", flags: MessageFlags.Ephemeral });
  }

  const botMember = await getBotMember(interaction.guild);

  if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)) {
    return interaction.reply({
      content: "No puedo cambiar apodos porque me falta el permiso Gestionar apodos.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!interaction.member.manageable) {
    return interaction.reply({
      content: "No puedo cambiar tu apodo. Mi rol tiene que estar por encima del tuyo.",
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.member.setNickname(nickname, `Cambio solicitado por ${interaction.user.tag}`);

  // Asignar roles configurados
  const roleResults = await updateRoles(interaction.member, botMember, config.nicknames);

  const lines = [`Listo, tu apodo ahora es **${nickname}**.`, ...roleResults].filter(Boolean);
  await interaction.reply({ content: lines.join("\n"), flags: MessageFlags.Ephemeral });
}

/**
 * Asigna promotedRoleIds y remueve removedRoleId según la config de nicknames.
 * Retorna un array de strings con el resultado de cada operación (para mostrar al usuario).
 */
async function updateRoles(member, botMember, nicknamesConfig) {
  const results = [];

  // Asignar roles
  const promotedRoleIds = (nicknamesConfig.promotedRoleIds ?? []).filter((id) => id && !id.startsWith("ID_"));
  for (const roleId of promotedRoleIds) {
    const role = await member.guild.roles.fetch(roleId).catch(() => null);
    if (!role) continue;

    if (member.roles.cache.has(role.id)) continue; // ya lo tiene, no hacer nada

    if (botMember.roles.highest.comparePositionTo(role) <= 0) {
      console.warn(`No pude asignar ${role.name}: mi rol está por debajo.`);
      continue;
    }

    await member.roles.add(role, "Asignado al cambiar apodo").catch((err) => {
      console.warn(`No pude asignar ${role.name}: ${err.message}`);
    });
  }

  // Remover rol
  const removedRoleId = nicknamesConfig.removedRoleId;
  if (removedRoleId && !removedRoleId.startsWith("ID_")) {
    const role = await member.guild.roles.fetch(removedRoleId).catch(() => null);
    if (role && member.roles.cache.has(role.id)) {
      if (botMember.roles.highest.comparePositionTo(role) > 0) {
        await member.roles.remove(role, "Removido al cambiar apodo").catch((err) => {
          console.warn(`No pude remover ${role.name}: ${err.message}`);
        });
      } else {
        console.warn(`No pude remover ${role.name}: mi rol está por debajo.`);
      }
    }
  }

  return results;
}
