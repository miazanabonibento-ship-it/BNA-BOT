const { SlashCommandBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Elimina una cantidad de mensajes del canal.")
  .addIntegerOption(option =>
    option.setName("cantidad").setDescription("Cantidad de mensajes a eliminar (1-100)").setRequired(true).setMinValue(1).setMaxValue(100));

async function execute(interaction, config) {
  const allowedRoles = config.roles?.managers || [];
  const hasPermission =
    interaction.member.permissions.has("Administrator") ||
    allowedRoles.some(id => interaction.member.roles.cache.has(id));

  if (!hasPermission) {
    await interaction.reply({ content: "No tenés permisos para usar este comando.", flags: 64 });
    return;
  }

  const cantidad = interaction.options.getInteger("cantidad", true);

  await interaction.deferReply({ flags: 64 });

  const mensajes = await interaction.channel.bulkDelete(cantidad, true).catch(() => null);

  const eliminados = mensajes ? mensajes.size : 0;

  await interaction.editReply({
    content: `Se eliminaron **${eliminados}** mensaje${eliminados !== 1 ? "s" : ""}.`,
  });
}

module.exports = { data, execute };