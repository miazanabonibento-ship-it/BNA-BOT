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
    // Si dejás esta lista vacía, se exige el permiso de Discord "Gestionar mensajes".
    // Si ponés IDs, solo esos roles pueden usar /anuncio.
    allowedCommandRoleIds: [
      // "1509659763468926986"
    ],

    // Roles que se pueden mencionar con /anuncio.
    // Si dejás esta lista vacía, se permite mencionar cualquier rol.
    mentionableRoleIds: [],

    // Cambiá a true si querés permitir @everyone desde /anuncio.
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
    panelDescription: "Selecciona una opción para abrir un ticket. Cuando un miembro superior esté disponible te atenderá lo antes posible.",
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
    // Roles que se asignan al cambiar el apodo (se asignan todos los que estén en la lista)
    promotedRoleIds: [
      "1510552250294997022",
      "1511504268384014476"  // Rol de "Cabo"
    ],
    // Rol que se remueve al cambiar el apodo. null = no remover ninguno.
    removedRoleId: "1509659763275989110"  // Rol de "Civil"
  },

  welcome: {
    autoRoleId: "1509659763275989110",
    imageUrl: "https://media.discordapp.net/attachments/1509254186678882305/1509727905339670688/62466c6bba37f.jpg?ex=6a1a3b2e&is=6a18e9ae&hm=7e3a958a26eb4be8e3cd9df792c6b93702cdbdb2d9db241653e35eb5858b4f97&=&format=webp",
    title: "Bienvenido/a",
    description: "{user}, bienvenido/a a **{server}**.",
    card: {
      backgroundImage: "https://i.imgur.com/ZqfCcZN.jpg",
      serverLabel: "GNA"
    }
  },

  goodbye: {
    imageUrl: "https://media.discordapp.net/attachments/1509254186678882305/1509727904999674006/malvinas.jpg?ex=6a1a3b2d&is=6a18e9ad&hm=e02670709c460ce9ce6fb09fe05c37b24175516993e5c4114086b2fbc6c9642c&=&format=webp",
    title: "Baja",
    description: "**{userTag}** salió de **{server}**.",
    card: {
      backgroundImage: "https://i.imgur.com/7kRgwsr.jpg",
      serverLabel: "GNA"
    }
  }
};
