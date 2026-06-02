const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
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

  // Dispatcher dinámico
  buttonHandlers: {
    [OPEN_MODAL_ID]: handleOpenModal,
  },
  modalHandlers: {
    [SUBMIT_MODAL_ID]: handleModalSubmit,
  },

  async execute(interaction, config) {
    const targetChannel = interaction.options.getChannel("canal") ?? interaction.channel;

    if (!targetChannel?.isTextBased()) {
      return interaction.reply({ content: "Ese canal no sirve para enviar el panel de apodos.", ephemeral: true });
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
    await interaction.reply({ content: `Panel de apodos enviado en ${targetChannel}.`, ephemeral: true });
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

async function handleModalSubmit(interaction) {
  const nickname = interaction.fields.getTextInputValue(INPUT_ID).trim();

  if (!nickname) {
    return interaction.reply({ content: "El apodo no puede estar vacío.", ephemeral: true });
  }

  const botMember = await getBotMember(interaction.guild);

  if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)) {
    return interaction.reply({
      content: "No puedo cambiar apodos porque me falta el permiso Gestionar apodos.",
      ephemeral: true,
    });
  }

  if (!interaction.member.manageable) {
    return interaction.reply({
      content: "No puedo cambiar tu apodo. Mi rol tiene que estar por encima del tuyo.",
      ephemeral: true,
    });
  }

  await interaction.member.setNickname(nickname, `Cambio solicitado por ${interaction.user.tag}`);
  await interaction.reply({ content: `Listo, tu apodo ahora es **${nickname}**.`, ephemeral: true });
}
