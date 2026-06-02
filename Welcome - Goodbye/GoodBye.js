const { AttachmentBuilder, Events } = require("discord.js");
const { getConfiguredChannel } = require("../utils/discord");
const { createGoodbyeCard } = require("./GoodbyeCard");

module.exports = {
  name: Events.GuildMemberRemove,

  async execute(member, config) {
    const channel = await getConfiguredChannel(member.guild, config.channels.goodbye);
    if (!channel) return;

    const image = await createGoodbyeCard(member, config.goodbye.card);
    const attachment = new AttachmentBuilder(image, { name: "goodbye.png" });

    await channel.send({ files: [attachment] });
  },
};
