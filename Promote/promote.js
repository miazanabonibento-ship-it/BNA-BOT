const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const RANKS = [
  { name: "Cabo",                 id: "1510552250294997022" },
  { name: "Cabo Primero",         id: "1510552288098385970" },
  { name: "Sargento",             id: "1510552249871372379" },
  { name: "Sargento 1",           id: "1510552240950087710" },
  { name: "Sargento Mayor",       id: "1510552277721682073" },
  { name: "Suboficial Principal", id: "1510552250823737394" },
  { name: "Subteniente",          id: "1510552281224056903" },
  { name: "Teniente",             id: "1509659763393302574" },
  { name: "Capitán",              id: "1509659763393302575" },
  { name: "Mayor",                id: "1509659763393302576" },
  { name: "Comandante",           id: "1509659763393302577" },
];

const RANK_IDS = RANKS.map(r => r.id);

function getCurrentRank(member) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (member.roles.cache.has(RANKS[i].id)) return i;
  }
  return -1;
}

const data = new SlashCommandBuilder()
  .setName("promote")
  .setDescription("Asciende o desciende a un miembro a un rango específico.")
  .addUserOption(option =>
    option.setName("usuario").setDescription("Miembro a modificar").setRequired(true))
  .addStringOption(option =>
    option.setName("accion").setDescription("Ascender o descender").setRequired(true)
      .addChoices(
        { name: "⬆️ Ascender", value: "up" },
        { name: "⬇️ Descender", value: "down" }
      ))
  .addStringOption(option =>
    option.setName("rango").setDescription("Rango destino").setRequired(true)
      .addChoices(
        { name: "Cabo",                 value: "1510552250294997022" },
        { name: "Cabo Primero",         value: "1510552288098385970" },
        { name: "Sargento",             value: "1510552249871372379" },
        { name: "Sargento 1",           value: "1510552240950087710" },
        { name: "Sargento Mayor",       value: "1510552277721682073" },
        { name: "Suboficial Principal", value: "1510552250823737394" },
        { name: "Subteniente",          value: "1510552281224056903" },
        { name: "Teniente",             value: "1509659763393302574" },
        { name: "Capitán",              value: "1509659763393302575" },
        { name: "Mayor",                value: "1509659763393302576" },
        { name: "Comandante",           value: "1509659763393302577" }
      ))
  .addStringOption(option =>
    option.setName("motivo").setDescription("Motivo del cambio").setRequired(false).setMaxLength(300));

async function execute(interaction, config) {
  const user = interaction.options.getUser("usuario", true);
  const accion = interaction.options.getString("accion", true);
  const rangoId = interaction.options.getString("rango", true);
  const motivo = interaction.options.getString("motivo") || "Sin motivo especificado";

  // Verificar permisos
  const allowedRoles = config.roles?.managers || [];
  const hasPermission = interaction.member.permissions.has("Administrator") ||
    allowedRoles.some(id => interaction.member.roles.cache.has(id));

  if (!hasPermission) {
    await interaction.reply({ content: "No tenés permisos para usar este comando.", flags: 64 });
    return;
  }

  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    await interaction.reply({ content: "No encontré ese usuario en el servidor.", flags: 64 });
    return;
  }

  const currentIndex = getCurrentRank(member);
  const newIndex = RANKS.findIndex(r => r.id === rangoId);
  const newRank = RANKS[newIndex];
  const oldRankName = currentIndex >= 0 ? RANKS[currentIndex].name : "Sin rango";

  if (accion === "up" && newIndex <= currentIndex) {
    await interaction.reply({
      content: `Para ascender tenés que elegir un rango mayor al actual (${oldRankName}).`,
      flags: 64
    });
    return;
  }

  if (accion === "down" && newIndex >= currentIndex) {
    await interaction.reply({
      content: `Para descender tenés que elegir un rango menor al actual (${oldRankName}).`,
      flags: 64
    });
    return;
  }

  const rolesToRemove = member.roles.cache.filter(r => RANK_IDS.includes(r.id));
  await member.roles.remove(rolesToRemove, `${accion === "up" ? "Ascenso" : "Descenso"} por ${interaction.user.tag}`).catch(() => null);
  await member.roles.add(newRank.id, `${accion === "up" ? "Ascenso" : "Descenso"} por ${interaction.user.tag}`).catch(() => null);

  const accionTexto = accion === "up" ? "⬆️ Ascendido" : "⬇️ Descendido";

  await interaction.reply({
    embeds: [{
      title: accionTexto,
      color: accion === "up" ? 0x27ae60 : 0xeb5757,
      fields: [
        { name: "Miembro",        value: `<@${user.id}>`,  inline: true },
        { name: "Rango anterior", value: oldRankName,       inline: true },
        { name: "Rango nuevo",    value: newRank.name,      inline: true },
        { name: "Motivo",         value: motivo },
        { name: "Modificado por", value: `<@${interaction.user.id}>` }
      ],
      timestamp: new Date().toISOString()
    }]
  });
}

module.exports = { data, execute };