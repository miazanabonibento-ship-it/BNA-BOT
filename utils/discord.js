/**
 * Obtiene un canal configurado del servidor
 * @param {Guild} guild - El servidor
 * @param {string} channelId - El ID del canal
 * @returns {Promise<Channel|null>} El canal o null si no existe
 */
async function getConfiguredChannel(guild, channelId) {
  if (!channelId) return null;
  try {
    return await guild.channels.fetch(channelId);
  } catch (error) {
    console.error(`No se pudo obtener el canal ${channelId}:`, error);
    return null;
  }
}

/**
 * Obtiene el miembro del bot en un servidor
 * @param {Guild} guild - El servidor
 * @returns {Promise<GuildMember>} El miembro del bot
 */
async function getBotMember(guild) {
  try {
    return await guild.members.fetchMe();
  } catch (error) {
    console.error(`No se pudo obtener el miembro del bot:`, error);
    return null;
  }
}

/**
 * Intenta agregar un rol a un miembro
 * @param {GuildMember} member - El miembro
 * @param {string} roleId - El ID del rol
 * @returns {Promise<boolean>} true si fue exitoso, false si falló
 */
async function tryAddRole(member, roleId) {
  if (!roleId) return false;
  try {
    const role = await member.guild.roles.fetch(roleId);
    if (!role) {
      console.error(`El rol ${roleId} no existe`);
      return false;
    }
    await member.roles.add(role);
    return true;
  } catch (error) {
    console.error(`No se pudo agregar el rol ${roleId} a ${member.user.tag}:`, error);
    return false;
  }
}

module.exports = {
  getConfiguredChannel,
  getBotMember,
  tryAddRole,
};
