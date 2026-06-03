const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const welcomeEvent = require("./Welcome");
const goodbyeEvent = require("./GoodBye");

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName("probar-welcome")
      .setDescription("Envia una prueba de la bienvenida usando tu usuario.")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    /**
     * Ejecuta un comando de prueba para la tarjeta de bienvenida
     * @param {CommandInteraction} interaction - La interacción del usuario
     * @param {Object} config - Configuración del servidor
     */
    async execute(interaction, config) {
      try {
        await interaction.deferReply({ flags: 64 });
        
        if (!config?.welcome || !config?.channels?.welcome) {
          await interaction.editReply("❌ El canal de bienvenida no está configurado.");
          return;
        }
        
        await welcomeEvent.execute(interaction.member, config, { skipAutoRole: true });
        await interaction.editReply("✅ Prueba de welcome enviada al canal configurado.");
      } catch (error) {
        console.error("Error en comando probar-welcome:", error);
        await interaction.editReply(`❌ Error al enviar prueba: ${error.message}`);
      }
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName("probar-baja")
      .setDescription("Envia una prueba de la baja usando tu usuario.")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    /**
     * Ejecuta un comando de prueba para la tarjeta de baja
     * @param {CommandInteraction} interaction - La interacción del usuario
     * @param {Object} config - Configuración del servidor
     */
    async execute(interaction, config) {
      try {
        await interaction.deferReply({ flags: 64 });
        
        if (!config?.goodbye || !config?.channels?.goodbye) {
          await interaction.editReply("❌ El canal de baja no está configurado.");
          return;
        }
        
        await goodbyeEvent.execute(interaction.member, config);
        await interaction.editReply("✅ Prueba de baja enviada al canal configurado.");
      } catch (error) {
        console.error("Error en comando probar-baja:", error);
        await interaction.editReply(`❌ Error al enviar prueba: ${error.message}`);
      }
    }
  }
];