const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { getConfiguredChannel, getBotMember, tryAddRole } = require("../utils/discord");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sancion")
    .setDescription("Registra una sanción a un usuario.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("usuario").setDescription("Usuario sancionado.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("razon").setDescription("Razón de la sanción.").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("tipo")
        .setDescription("Tipo de sanción.")
        .setRequired(false)
        .addChoices(
          { name: "Advertencia", value: "Advertencia" },
          { name: "Mute", value: "Mute" },
          { name: "Kick", value: "Kick" },
          { name: "Ban", value: "Ban" },
          { name: "Otro", value: "Otro" }
        )
    )
    .addStringOption((option) =>
      option.setName("duracion").setDescription("Duración si aplica, por ejemplo 1h, 24h, permanente.").setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("strike")
        .setDescription("Número de strike o gravedad.")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction, config) {
    const user = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("razon", true);
    const type = interaction.options.getString("tipo") ?? "Advertencia";
    const duration = interaction.options.getString("duracion") ?? "No especificada";
    const strike = interaction.options.getInteger("strike");

    const roleResult = await addStrikeRole(interaction, user, config.strikes, strike);

    const embed = new EmbedBuilder()
      .setColor(config.colors.sanctions)
      .setTitle("Sanción registrada")
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "Usuario", value: `${user} \`${user.tag}\``, inline: false },
        { name: "Tipo", value: type, inline: true },
        { name: "Duración", value: duration, inline: true },
        { name: "Strike", value: strike ? String(strike) : "No especificado", inline: true },
        { name: "Razón", value: reason, inline: false },
        { name: "Rol strike", value: roleResult, inline: false },
        { name: "Moderador", value: `${interaction.user} \`${interaction.user.tag}\``, inline: false }
      )
      .setTimestamp();

    const logChannel = await getConfiguredChannel(interaction.guild, config.channels.sanctionsLog);
    await (logChannel ?? interaction.channel).send({ embeds: [embed] });
    await interaction.reply({ content: `Sanción registrada para ${user}. ${roleResult}`, ephemeral: true });
  },
};

async function addStrikeRole(interaction, user, strikesConfig, strikeNumber) {
  if (!strikeNumber) return "No se agregó rol: no se especificó número de strike.";

  const roleId = strikesConfig?.roleIds?.[strikeNumber] ?? strikesConfig?.roleId;
  if (!roleId || roleId.startsWith("ID_")) return `No configurado para Strike ${strikeNumber}.`;

  const botMember = await getBotMember(interaction.guild);
  const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);

  const result = await tryAddRole(botMember, member, role, `Strike registrado por ${interaction.user.tag}`);

  // Personalizar mensaje para el contexto de strikes
  if (result.ok && member?.roles.cache.has(role?.id)) {
    return `El usuario ya tenía el rol Strike ${strikeNumber}: ${role}.`;
  }
  if (result.ok) {
    return `Rol Strike ${strikeNumber} agregado: ${role}.`;
  }
  return result.message;
}
