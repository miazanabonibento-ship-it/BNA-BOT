const { AttachmentBuilder, Events, PermissionFlagsBits } = require("discord.js");
const { getConfiguredChannel, getBotMember, tryAddRole } = require("../utils/discord");
const { createWelcomeCard } = require("./WelcomeCard");

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member, config, options = {}) {
    if (!options.skipAutoRole) {
      await addAutoRole(member, config.welcome.autoRoleId);
    }

    const channel = await getConfiguredChannel(member.guild, config.channels.welcome);
    if (!channel) return;

    const image = await createWelcomeCard(member, config.welcome.card);
    const attachment = new AttachmentBuilder(image, { name: "welcome.png" });

    await channel.send({ content: `${member}`, files: [attachment] });
  },
};

async function addAutoRole(member, roleId) {
  if (!roleId || roleId.startsWith("ID_")) return;

  const botMember = await getBotMember(member.guild);
  const role = await member.guild.roles.fetch(roleId).catch(() => null);
  const result = await tryAddRole(botMember, member, role, "Rol automático de bienvenida");

  if (!result.ok) {
    console.warn(`No pude dar el rol automático: ${result.message}`);
  }
}
