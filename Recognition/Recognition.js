const { ChannelType, PermissionFlagsBits, SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
const { getBotMember, getMissingPermissions, MESSAGE_PERMISSIONS } = require("../utils/discord");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reconocimiento")
    .setDescription("Publica un reconocimiento con puntuaciones.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((option) =>
      option.setName("usuario").setDescription("Usuario reconocido.").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("trabajo_equipo").setDescription("Puntuación de trabajo en equipo del 1 al 10.").setMinValue(1).setMaxValue(10).setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("comportamiento").setDescription("Puntuación de buen comportamiento del 1 al 10.").setMinValue(1).setMaxValue(10).setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("resolucion").setDescription("Puntuación de resolución de problemas del 1 al 10.").setMinValue(1).setMaxValue(10).setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("ideas").setDescription("Puntuación de ideas del 1 al 10.").setMinValue(1).setMaxValue(10).setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("evolucion").setDescription("Puntuación de evolución del 1 al 10.").setMinValue(1).setMaxValue(10).setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("fecha").setDescription("Fecha del reconocimiento (DD/MM/AAAA). Si lo dejás vacío usa la fecha de hoy.").setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal donde se enviará. Si no elegís uno, se envía acá.")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("usuario", true);
    const targetChannel = interaction.options.getChannel("canal") ?? interaction.channel;

    const scores = {
      team: interaction.options.getInteger("trabajo_equipo", true),
      behavior: interaction.options.getInteger("comportamiento", true),
      resolution: interaction.options.getInteger("resolucion", true),
      ideas: interaction.options.getInteger("ideas", true),
      evolution: interaction.options.getInteger("evolucion", true),
    };

    const finalScore = Object.values(scores).reduce((total, s) => total + s, 0);
    const date = interaction.options.getString("fecha") ?? getTodayDate();

    if (!targetChannel?.isTextBased()) {
      return interaction.reply({ content: "Ese canal no sirve para enviar reconocimientos.", flags: MessageFlags.Ephemeral });
    }

    const botMember = await getBotMember(interaction.guild);
    const missing = getMissingPermissions(targetChannel, botMember, MESSAGE_PERMISSIONS);

    if (missing.length > 0) {
      return interaction.reply({
        content: `No puedo mandar el reconocimiento en ${targetChannel}. Me faltan: ${missing.join(", ")}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const message = await targetChannel.send({
      content: [
        `Fecha: ${date}`,
        `Nombre: ${user}`,
        `Trabajo en equipo (1-10): ${scores.team}`,
        `Buen comportamiento (1-10): ${scores.behavior}`,
        `Resolución de problemas (1-10): ${scores.resolution}`,
        `Ideas (1-10): ${scores.ideas}`,
        `Evolución (1-10): ${scores.evolution}`,
        `Puntuación final: ${finalScore}`,
      ].join("\n"),
    });

    for (const reaction of ["✅", "❤️", "☺"]) {
      await message.react(reaction);
    }

    await interaction.reply({ content: `Reconocimiento enviado en ${targetChannel}.`, flags: MessageFlags.Ephemeral });
  },
};

/**
 * Retorna la fecha de hoy en formato DD/MM/AAAA.
 */
function getTodayDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}
