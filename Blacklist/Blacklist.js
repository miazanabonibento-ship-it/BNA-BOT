const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
const { getConfiguredChannel, getBotMember } = require("../utils/discord");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Registra a un usuario en blacklist.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option.setName("usuario").setDescription("Usuario agregado a blacklist.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("razon").setDescription("Razón de la blacklist.").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("estado")
        .setDescription("Estado de la blacklist.")
        .setRequired(false)
        .addChoices(
          { name: "Activa", value: "Activa" },
          { name: "Temporal", value: "Temporal" },
          { name: "Permanente", value: "Permanente" },
          { name: "Removida", value: "Removida" }
        )
    )
    .addStringOption((option) =>
      option.setName("duracion").setDescription("Duración si aplica, por ejemplo 7d, 30d, permanente.").setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("pruebas").setDescription("Link o detalle de pruebas si corresponde.").setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("borrar_mensajes")
        .setDescription("Días de mensajes a borrar al banear. De 0 a 7.")
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

  async execute(interaction, config) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("razon", true);
    const status = interaction.options.getString("estado") ?? "Activa";
    const duration = interaction.options.getString("duracion") ?? "No especificada";
    const evidence = interaction.options.getString("pruebas") ?? "No especificadas";
    const deleteMessageDays = interaction.options.getInteger("borrar_mensajes") ?? 0;

    const banResult = await banBlacklistedUser(interaction, user, reason, deleteMessageDays, status);

    const embed = new EmbedBuilder()
      .setColor(config.colors.blacklist)
      .setTitle("Usuario agregado a blacklist")
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "Usuario", value: `${user} \`${user.tag}\``, inline: false },
        { name: "Estado", value: status, inline: true },
        { name: "Duración", value: duration, inline: true },
        { name: "Razón", value: reason, inline: false },
        { name: "Pruebas", value: evidence, inline: false },
        { name: "Ban", value: banResult, inline: false },
        { name: "Staff", value: `${interaction.user} \`${interaction.user.tag}\``, inline: false }
      )
      .setTimestamp();

    const logChannel = await getConfiguredChannel(interaction.guild, config.channels.blacklistLog);
    await (logChannel ?? interaction.channel).send({ embeds: [embed] });
    await interaction.editReply(`Blacklist registrada para ${user}. ${banResult}`);
  },
};

async function banBlacklistedUser(interaction, user, reason, deleteMessageDays, status) {
  if (status === "Removida") {
    return "No baneado: el estado seleccionado fue Removida.";
  }

  const botMember = await getBotMember(interaction.guild);

  if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
    return "No baneado: me falta el permiso Banear miembros.";
  }

  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (member && !member.bannable) {
    return "No baneado: mi rol está por debajo del usuario o no tengo permisos suficientes.";
  }

  await interaction.guild.bans.create(user.id, {
    deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60,
    reason: `Blacklist ${status.toLowerCase()}: ${reason} | Staff: ${interaction.user.tag}`,
  });

  return status === "Temporal"
    ? "Usuario baneado. La duración queda registrada en el log; Discord no lo desbanea automáticamente."
    : "Usuario baneado.";
}
