const { PermissionFlagsBits } = require("discord.js");

/**
 * Obtiene un canal de texto configurado por ID.
 * Retorna null si el ID es inválido, el canal no existe o no es de texto.
 */
async function getConfiguredChannel(guild, channelId) {
  if (!channelId || channelId.startsWith("ID_")) return null;
  try {
    const channel = await guild.channels.fetch(channelId);
    return channel?.isTextBased() ? channel : null;
  } catch {
    return null;
  }
}

/**
 * Obtiene el miembro bot del servidor, usando caché si está disponible.
 */
async function getBotMember(guild) {
  return guild.members.me ?? guild.members.fetchMe();
}

/**
 * Verifica qué permisos le faltan al bot en un canal dado.
 * @param {Array<[bigint, string]>} requiredPermissions - pares [flag, label]
 * @returns {string[]} lista de labels de permisos faltantes
 */
function getMissingPermissions(channel, botMember, requiredPermissions) {
  const permissions = channel.permissionsFor(botMember);
  if (!permissions) return ["Ver canal"];
  return requiredPermissions
    .filter(([flag]) => !permissions.has(flag))
    .map(([, label]) => label);
}

/** Permisos estándar para enviar embeds. */
const EMBED_PERMISSIONS = [
  [PermissionFlagsBits.ViewChannel, "Ver canal"],
  [PermissionFlagsBits.SendMessages, "Enviar mensajes"],
  [PermissionFlagsBits.EmbedLinks, "Insertar enlaces"],
];

/** Permisos para enviar mensajes con reacciones. */
const MESSAGE_PERMISSIONS = [
  [PermissionFlagsBits.ViewChannel, "Ver canal"],
  [PermissionFlagsBits.SendMessages, "Enviar mensajes"],
  [PermissionFlagsBits.AddReactions, "Agregar reacciones"],
];

/**
 * Intenta agregar un rol a un miembro con validaciones completas.
 * @param {GuildMember} botMember
 * @param {GuildMember|null} targetMember
 * @param {Role|null} role
 * @param {string} auditReason
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
async function tryAddRole(botMember, targetMember, role, auditReason) {
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return { ok: false, message: "No pude darlo: me falta el permiso Gestionar roles." };
  }
  if (!role) {
    return { ok: false, message: "No pude darlo: el rol configurado no existe." };
  }
  if (role.managed) {
    return { ok: false, message: "No pude darlo: ese rol lo gestiona una integración." };
  }
  if (botMember.roles.highest.comparePositionTo(role) <= 0) {
    return { ok: false, message: "No pude darlo: mi rol está por debajo del rol configurado." };
  }
  if (!targetMember) {
    return { ok: false, message: "No pude darlo: no encontré al usuario en el servidor." };
  }
  if (targetMember.roles.cache.has(role.id)) {
    return { ok: true, message: `El usuario ya tenía el rol ${role}.` };
  }
  await targetMember.roles.add(role, auditReason);
  return { ok: true, message: `Rol agregado: ${role}.` };
}

/**
 * Normaliza un array de IDs de roles, filtrando placeholders y valores inválidos.
 */
function normalizeRoleIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry : entry?.id))
    .filter((id) => id && !id.startsWith("ID_"));
}

/**
 * Genera un mensaje de error amigable a partir de un error de la API de Discord.
 */
function getFriendlyErrorMessage(error) {
  const messages = {
    50001: "No tengo acceso a ese canal. Revisame permisos de Ver canal, Enviar mensajes e Insertar enlaces.",
    50007: "No puedo enviar mensajes directos a ese usuario (puede tener los DMs cerrados).",
    50013: "Me faltan permisos para hacer esa acción. Revisame el rol del bot y los permisos del canal.",
    50035: "Discord rechazó los datos enviados. Revisame IDs de canales/categorías/roles en config.js.",
  };
  return messages[error?.code] ?? "Ocurrió un error ejecutando esta acción.";
}

module.exports = {
  getConfiguredChannel,
  getBotMember,
  getMissingPermissions,
  tryAddRole,
  normalizeRoleIds,
  getFriendlyErrorMessage,
  EMBED_PERMISSIONS,
  MESSAGE_PERMISSIONS,
};
