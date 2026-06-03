module.exports = {
  colors: {
    announcements: 0x2f80ed,
    blacklist: 0x111111,
    sanctions: 0xd64545,
    tickets: 0x2f80ed,
    nicknames: 0x2f80ed,
    welcome: 0x2ecc71,
    goodbye: 0xd64545
  },

  announcements: {
    allowedCommandRoleIds: [],
    mentionableRoleIds: [],
    allowEveryoneMention: true
  },

  channels: {
    welcome: "1509659764701790213",
    goodbye: "1509659765192659155",
    blacklistLog: "1509659765192659160",
    sanctionsLog: "1509659765192659159"
  },

  tickets: {
    categoryId: "1511438319374958632",
    authorizedRoleIds: [
      "1509659763468926986"
    ],
    panelTitle: "Crear ticket",
    panelDescription: "Seleccioná una opción para abrir un ticket. Cuando un miembro superior esté disponible te atenderá lo antes posible.",
    buttons: [
      { id: "solicitar-baja",    label: "Solicitar Baja",    emoji: "🎫", style: "Primary"   },
      { id: "solicitar-ascenso", label: "Solicitar Ascenso", emoji: "📈", style: "Primary"   },
      { id: "reporte",           label: "Reporte",           emoji: "⚠️", style: "Danger"    },
      { id: "duda",              label: "Duda",              emoji: "❓", style: "Secondary" }
    ]
  },

  strikes: {
    roleIds: {
      1: "1509659763275989105",
      2: "1509669600973820104"
    }
  },

  nicknames: {
    panelTitle: "Cambiar apodo",
    panelDescription: "Tocá el botón de abajo para escribir tu nombre IC dentro del servidor.",
    button: {
      label: "Cambiar apodo",
      emoji: "✏️",
      style: "Primary"
    },
    // Roles que se asignan al cambiar el apodo
    promotedRoleIds: [
      "1510552250294997022",
      "1511504268384014476"
    ],
    // Rol que se remueve al cambiar el apodo. null = no remover ninguno.
    removedRoleId: "1509659763275989110"  // Civil
  },

  welcome: {
    autoRoleId: "1509659763275989110",
    card: {
      // Reemplazá esta URL con una imagen subida permanentemente (Imgur, etc.)
      // Las URLs de Discord CDN expiran. Dejala vacía para usar el fondo por defecto.
      backgroundImage: "",
      serverLabel: "GNA"
    }
  },

  goodbye: {
    card: {
      // Igual que arriba: usá una URL permanente o dejala vacía para el fondo por defecto.
      backgroundImage: "",
      serverLabel: "GNA"
    }
  }
};
