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
    // Si dejas esta lista vacia, se exige el permiso de Discord "Gestionar mensajes".
    // Si pones IDs, solo esos roles pueden usar /anuncio.
    allowedCommandRoleIds: [
      // "1509659763468926986"
    ],

    // Roles que se pueden mencionar con /anuncio.
    // Si dejas esta lista vacia, se permite mencionar cualquier rol.
    mentionableRoleIds: [
      // "1509659763393302577",
      // "1509659763393302576",
      // "1509659763393302575",
      // "11509659763393302574",
      // "1509659763393302574",
    ],

    // Cambia a true si queres permitir @everyone desde /anuncio.
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
    panelDescription: "Selecciona una opcion para abrir un ticket. Cuando un miembro superior este disponible te atendera lo antes posible.",
    buttons: [
      {
        id: "solicitar-baja",
        label: "Solicitar Baja",
        emoji: "\uD83C\uDFAB",
        style: "Primary"
      },
      {
        id: "solicitar-ascenso",
        label: "Solicitar Ascenso",
        emoji: "\uD83D\uDCC8",
        style: "Primary"
      },
      {
        id: "reporte",
        label: "Reporte",
        emoji: "\u26A0\uFE0F",
        style: "Danger"
      },
      {
        id: "duda",
        label: "Duda",
        emoji: "\u2753",
        style: "Secondary"
      }
    ]
  },

  strikes: {
    roleIds: {
      1: "1509659763275989105",
      2: "1509669600973820104",
    }
  },

  nicknames: {
    panelTitle: "Cambiar apodo",
    panelDescription: "Toca el boton de abajo para escribir tu nombre IC dentro del servidor.",
    button: {
      label: "Cambiar apodo",
      emoji: "\u270F\uFE0F",
      style: "Primary"
    },
    // Rol que se asigna automáticamente cuando cambias tu apodo
    promotedRoleId: "1510552250294997022", // Rol de "Cabo"
    // Rol que se remueve cuando cambias tu apodo (opcional)
    removedRoleId: "1509659763275989110" // Rol de "Civil" (opcional, déjalo en null si no quieres remover)
  },

  welcome: {
    autoRoleId: "1509659763275989110",
    imageUrl: "https://media.discordapp.net/attachments/1509254186678882305/1509727905339670688/62466c6bba37f.jpg?ex=6a1a3b2e&is=6a18e9ae&hm=7e3a958a26eb4be8e3cd9df792c6b93702cdbdb2d9db241653e35eb5858b4f97&=&format=webp",
    title: "Bienvenido/a",
    description: "{user}, bienvenido/a a **{server}**.",
    card: {
      backgroundImage: "https://media.discordapp.net/attachments/1509254186678882305/1509727905339670688/62466c6bba37f.jpg?ex=6a1a3b2e&is=6a18e9ae&hm=7e3a958a26eb4be8e3cd9df792c6b93702cdbdb2d9db241653e35eb5858b4f97&=&format=webp",
      serverLabel: "GNA"
    }
  },

  goodbye: {
    imageUrl: "https://media.discordapp.net/attachments/1509254186678882305/1509727904999674006/malvinas.jpg?ex=6a1a3b2d&is=6a18e9ad&hm=e02670709c460ce9ce6fb09fe05c37b24175516993e5c4114086b2fbc6c9642c&=&format=webp",
    title: "Baja",
    description: "**{userTag}** salio de **{server}**.",
    card: {
      backgroundImage: "https://media.discordapp.net/attachments/1509254186678882305/1509727904999674006/malvinas.jpg?ex=6a1a3b2d&is=6a18e9ad&hm=e02670709c460ce9ce6fb09fe05c37b24175516993e5c4114086b2fbc6c9642c&=&format=webp",
      serverLabel: "GNA"
    }
  }
};
