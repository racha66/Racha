const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot activo"));

app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Keep alive server activo");
});

const mongoose = require("mongoose");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// 🛡️ ERRORES GLOBALES
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// 📡 MONGO
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("🟢 MongoDB conectado"))
  .catch(err => {
    console.log("🔴 Mongo error:", err);
    process.exit(1);
  });

// 📊 USER SCHEMA
const userSchema = new mongoose.Schema({
  userId: String,
  streakDays: { type: Number, default: 1 },
  lastAntiSpam: { type: Number, default: 0 },
  lastStreakUpdate: { type: Number, default: 0 },
  claimedRewards: { type: [Number], default: [] },

  missions: {
  mission1: { type: Number, default: 0 },
  mission2: { type: Number, default: 0 },
  mission3: { type: Number, default: 0 },
  completed: { type: [Number], default: [] },
  lastReset: { type: Number, default: 0 }
}
});

const User = mongoose.model("User", userSchema);

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔧 COMANDOS
const commands = [
  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Ver tu estado o el de otro usuario")
    .addUserOption(o => o.setName("usuario").setDescription("Usuario a consultar")),

  new SlashCommandBuilder()
    .setName("top")
    .setDescription("Top de rachas sin ping"),

  new SlashCommandBuilder()
    .setName("setstreak")
    .setDescription("Editar racha de un usuario")
    .addUserOption(o => o.setName("usuario").setDescription("Usuario").setRequired(true))
    .addIntegerOption(o => o.setName("dias").setDescription("Nueva racha").setRequired(true)),

  new SlashCommandBuilder()
    .setName("add1day")
    .setDescription("Añade 1 día de racha a todos los usuarios"),

  new SlashCommandBuilder()
    .setName("add10days")
    .setDescription("Añade 10 días a todos los usuarios"),

  new SlashCommandBuilder()
    .setName("resetall")
    .setDescription("Reinicia la racha de TODOS los usuarios a 0")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// ================================
// 🔥 RECOMPENSAS DE RACHAS
// ================================

const streakRewards = {
  8: ["1459740562474275006"], // Ticket Extra
  12: ["1521909363592400937"], // Token Tier 2
  16: ["1521909178380062920"], // Personalizador
  24: ["1521909363592400937"], // Token Tier 2
  28: ["1521909178380062920"], // Personalizador
  32: ["1430858204920942603"], // Definitivo
  36: ["1524896070470205571"], // Token Tier 3
  40: ["1521909178380062920"], // Personalizador
  44: [
    "1451185369390387222", // Luna Roja
    "1517347810167619697", // Token
    "1521909363592400937", // Token Tier 2
    "1524896070470205571" // Token Tier 3
  ],
  48: ["1521909178380062920"],
  54: ["1524896070470205571"],
  58: ["1521909178380062920"],
  62: [
    "1521909363592400937",
    "1524896070470205571"
  ],
  66: [
    "1521909178380062920",
    "1517347810167619697"
  ],
  70: ["1451185369390387222"],
  74: ["1524896070470205571"],
  78: ["1521909178380062920"],
  82: ["1524896070470205571"],
  86: [
    "1524896070470205571",
    "1521909363592400937"
  ],
  90: ["1521909178380062920"],
  94: [
    "1517347810167619697",
    "1521909363592400937",
    "1524896070470205571"
  ],
  98: ["1521909178380062920"],
  100: [
    "1465082323220562013", // ER
    "1517347810167619697",
    "1521909363592400937",
    "1524896070470205571",
    "1521909178380062920"
  ]
  };

const rewards = [
"2 días = 1 Nivel de Arcane 💙",
"4 días = 300k 🌙 de ⟬💸⟭・economía",
"6 días = 1 Nivel de Arcane 💙",
"8 días =『 🎫 › Ticket Extra ‹ 』",
"10 días = 1 Nivel de Arcane 💙",
"12 días =『 📀 › Token Tier 2 ‹ 』",
"14 días = 1 Nivel de Arcane 💙",
"16 días =『 🎨 › Personalizador ‹ 』",
"18 días = 1 Nivel de Arcane 💙",
"20 días =『 🦈 › Tradeador Destacado ‹ 』/『 💬 › Amante del Habla ‹ 』 o 『 📀 › Token Tier 2 ‹ 』",
"22 días = 1 Nivel de Arcane 💙",
"24 días =『 📀 › Token Tier 2 ‹ 』",
"26 días = 1 Nivel de Arcane 💙",
"28 días =『 🎨 › Personalizador ‹ 』",
"30 días = 1 Nivel de Arcane 💙",
"32 días =『 🔥 › Definitivo ‹ 』 permanente",
"34 días = 1 Nivel de Arcane 💙",
"36 días =『 💿 › Token Tier 3 ‹ 』",
"38 días = 1 Nivel de Arcane 💙",
"40 días =『 🎨 › Personalizador ‹ 』",
"42 días = 1 Nivel de Arcane 💙",
"44 días =『 🐦‍🔥 › Luna Roja ‹ 』 o 『 🪙 › Token ‹ 』 + 『 📀 › Token Tier 2 ‹ 』 + 『 💿 › Token Tier 3 ‹ 』",
"46 días = 1 Nivel de Arcane 💙",
"48 días =『 🎨 › Personalizador ‹ 』",
"50 días =『 ⭐️ › Racha 50 ‹ 』",
"52 días = 1 Nivel de Arcane 💙",
"54 días =『 💿 › Token Tier 3 ‹ 』",
"56 días = 1 Nivel de Arcane 💙",
"58 días =『 🎨 › Personalizador ‹ 』",
"60 días = 1 Nivel de Arcane 💙",
"62 días =『 📀 › Token Tier 2 ‹ 』 + 『 💿 › Token Tier 3 ‹ 』",
"64 días = 1 Nivel de Arcane 💙",
"66 días =『 🎨 › Personalizador ‹ 』 + 『 🪙 › Token ‹ 』",
"68 días = 1 Nivel de Arcane 💙",
"70 días =『 🐦‍🔥 › Luna Roja Permanente ‹ 』",
"72 días = 1 Nivel de Arcane 💙",
"74 días =『 💿 › Token Tier 3 ‹ 』",
"76 días = 1 Nivel de Arcane 💙",
"78 días =『 🎨 › Personalizador ‹ 』",
"80 días = 1 Nivel de Arcane 💙",
"82 días =『 💿 › Token Tier 3 ‹ 』",
"84 días = 1 Nivel de Arcane 💙",
"86 días =『 💿 › Token Tier 3 ‹ 』 + 『 📀 › Token Tier 2 ‹ 』",
"88 días = 1 Nivel de Arcane 💙",
"90 días =『 🎨 › Personalizador ‹ 』",
"92 días = 1 Nivel de Arcane 💙",
"94 días =『 🪙 › Token ‹ 』 + 『 📀 › Token Tier 2 ‹ 』 + 『 💿 › Token Tier 3 ‹ 』",
"96 días = 1 Nivel de Arcane 💙",
"98 días =『 🎨 › Personalizador ‹ 』",
"100 días =『 🔥 › Racha 100 ‹ 』 + 『 🌌 › ER ‹ 』 + 『 🪙 › Token ‹ 』 + 『 📀 › Token Tier 2 ‹ 』 + 『 💿 › Token Tier 3 ‹ 』 + 『 🎨 › Personalizador ‹ 』 + 2 Niveles de Arcane 💙"
];

function createRewardEmbed(page) {
    const rewardsPerPage = 13;
    const start = page * rewardsPerPage;
    const end = start + rewardsPerPage;

    const description = rewards
        .slice(start, end)
        .map(reward => `\`\`\`${reward}\`\`\``)
        .join("\n");

    const totalPages = Math.ceil(rewards.length / rewardsPerPage);

    return new EmbedBuilder()
        .setColor("#D8C28A")
        .setTitle("🔥 ¡Recompensas de las Rachas!")
        .setDescription(description)
        .setImage("https://cdn.discordapp.com/attachments/1426388674567868558/1524905172327731292/8DF63752-7070-4C62-83BE-EC73625E1C3C.png?ex=6a51721c&is=6a50209c&hm=355b447dbbf87618df761a107bd32a21758df901cfc8c0eff26aa780be2817a5&")
        .setFooter({
            text: `Página ${page + 1}/${totalPages}`
        });
}


// 🎯 EMBED DE MISIONES

function createMissionEmbed(user) {
const ahora = Date.now();
const UN_DIA = 86400000;

const restante = UN_DIA - (ahora - (user.missions.lastReset || ahora));

let tiempoRestante = "🔄 Reinicio disponible";

if (restante > 0) {

    const horas = Math.floor(restante / (1000 * 60 * 60));

    const minutos = Math.floor(
        (restante % (1000 * 60 * 60)) / (1000 * 60)
    );

    tiempoRestante = `⏳ Reinicio en: **${horas}h ${minutos}m**`;

}
    return new EmbedBuilder()
        .setColor("#D8C28A")
        .setTitle("🎯 ¡Misiones!")
 .setDescription(
`${tiempoRestante}

\`\`\`
💬 Misión 1

Progreso:
${user.missions.mission1} / 800 mensajes

🎁 Recompensa:
📀 Token Tier 2
\`\`\`

\`\`\`
💬 Misión 2

Progreso:
${user.missions.mission2} / 2000 mensajes

🎁 Recompensa:
💿 Token Tier 3
\`\`\`

\`\`\`
💬 Misión 3

Progreso:
${user.missions.mission3} / 700 mensajes

🎁 Recompensa:
🎨 Personalizador
\`\`\``
)
        .setImage("https://cdn.discordapp.com/attachments/1426388674567868558/1524933200021946511/C0221595-042D-4400-8B63-5092AF4993B6.gif?ex=6a518c36&is=6a503ab6&hm=427f7632cfa37096fdaec1665f14a65577f1f388badee2cfcf5f424f236921a3&");
}

// 🔥 READY
client.once("ready", async () => {
  console.log(`🤖 Bot listo como ${client.user.tag}`);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash commands registrados");
  } catch (error) {
    console.error("❌ Error al registrar comandos:", error);
  }
});

// 📩 MENSAJES (Lógica de 24 horas)
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    
    // 📖 COMANDO GUÍA

if (message.content.trim().toLowerCase() === "<guia") {

  const embed = new EmbedBuilder()
    .setColor("#D8C28A")
    .setTitle("📖 Guía del Sistema de Rachas del Servidor")
    .setDescription(
`Bienvenido al sistema de recompensas 🔥

Aquí podrás conseguir beneficios participando y manteniendo tu actividad.

━━━━━━━━━━━━━━━━

🔥 **Sistema de Rachas**

Mantén tu actividad diaria para aumentar tu racha.

Cada cierto número de días podrás reclamar recompensas especiales usando:

\`\`\`
<reclamar
\`\`\`

Consulta todas las recompensas disponibles con:

\`\`\`
<recompensas
\`\`\`

━━━━━━━━━━━━━━━━

🎯 **Sistema de Misiones**

Completa misiones de mensajes para conseguir recompensas únicas.

Puedes revisar tu progreso con:

\`\`\`
<misiones
\`\`\`

Cuando completes una misión, reclama tu premio con:

\`\`\`
<reclamarmision
\`\`\`

━━━━━━━━━━━━━━━━

🏆 **Comandos útiles**

📊 Ver tu estado:
\`\`\`
/status
\`\`\`

🏆 Ver los mejores usuarios:
\`\`\`
/top
\`\`\`

━━━━━━━━━━━━━━━━

💡 **Consejo**

Mantente activo, completa tus misiones y conserva tu racha para desbloquear las mejores recompensas.

⏳ Las misiones tienen un límite de tiempo.
Si no completas tus objetivos antes del reinicio, tu progreso volverá a 0.

¡Buena suerte y disfruta del servidor! ✨`
    )
    .setImage("https://cdn.discordapp.com/attachments/1426388948963299523/1524947076914479285/874D0967-F614-4F9F-9719-08DE68E3CAAC.gif?ex=6a519923&is=6a5047a3&hm=145d03d39e7816404a2dc4928edfb78f145062a68d457d7f52c97eaa0f7463a6&")
    .setFooter({
      text: "Sistema de Rachas • Misiones • Recompensas"
    });

  return message.channel.send({
    embeds: [embed]
  });

}
    
    // 🎯 COMANDO MISIONES
if (message.content.trim().toLowerCase() === "<misiones") {

  const id = message.author.id;

  let user = await User.findOne({ userId: id });

  if (!user) {
    return message.reply("❌ Aún no tienes progreso de misiones.");
  }

  if (!user.missions) {
    user.missions = {
      mission1: 0,
      mission2: 0,
      mission3: 0,
      completed: []
    };

    await user.save();
  }

  return message.channel.send({
    embeds: [createMissionEmbed(user)]
  });
}
    // 🎁 COMANDO RECLAMAR MISIONES

if (message.content.trim().toLowerCase() === "<reclamarmision") {

  const id = message.author.id;

  let user = await User.findOne({ userId: id });

  if (!user || !user.missions) {

    return message.reply("❌ Aún no tienes progreso de misiones.");

  }

  const member = message.member;

  let recompensas = [];

  if (!user.missions.completed) {

    user.missions.completed = [];

  }

  const missionRoles = {

    1: "1521909363592400937", // Token Tier 2

    2: "1524896070470205571", // Token Tier 3

    3: "1521909178380062920"  // Personalizador

  };

  // 🎯 Misión 1

  if (

    user.missions.mission1 >= 800 &&

    !user.missions.completed.includes(1)

  ) {

    await member.roles.add(missionRoles[1]);

    recompensas.push(`<@&${missionRoles[1]}>`);

    user.missions.completed.push(1);

  }

  // 🎯 Misión 2

  if (

    user.missions.mission2 >= 2000 &&

    !user.missions.completed.includes(2)

  ) {

    await member.roles.add(missionRoles[2]);

    recompensas.push(`<@&${missionRoles[2]}>`);

    user.missions.completed.push(2);

  }

  // 🎯 Misión 3

  if (

    user.missions.mission3 >= 700 &&

    !user.missions.completed.includes(3)

  ) {

    await member.roles.add(missionRoles[3]);

    recompensas.push(`<@&${missionRoles[3]}>`);

    user.missions.completed.push(3);

  }

  if (recompensas.length === 0) {

    return message.reply("❌ No tienes misiones completadas para reclamar.");

  }

  await user.save();

  const embed = new EmbedBuilder()

    .setColor("#D8C28A")

    .setTitle("🎯 Recompensas de misiones reclamadas")

    .setDescription(

      recompensas.map(r => `🎁 ${r}`).join("\n")

    )

    .setFooter({

      text: "¡Sigue completando misiones!"

    })

    .setImage("https://cdn.discordapp.com/attachments/1426388674567868558/1524933200021946511/C0221595-042D-4400-8B63-5092AF4993B6.gif?ex=6a518c36&is=6a503ab6&hm=427f7632cfa37096fdaec1665f14a65577f1f388badee2cfcf5f424f236921a3&");

  return message.channel.send({

    embeds: [embed]

  });

}
    
    // 🎯 SISTEMA DE MISIONES
if (message.channel.id === "1425641857173557249") {

  const id = message.author.id;

  let user = await User.findOne({ userId: id });

  if (!user) {
  user = await User.create({
    userId: id
  });
}

if (!user.missions) {
  user.missions = {
    mission1: 0,
    mission2: 0,
    mission3: 0,
    completed: [],
    lastReset: Date.now()
  };
}

const ahora = Date.now();
const UN_DIA = 86400000;

if (ahora - user.missions.lastReset >= UN_DIA) {

  user.missions.mission1 = 0;
  user.missions.mission2 = 0;
  user.missions.mission3 = 0;
  user.missions.completed = [];
  user.missions.lastReset = ahora;

}

  user.missions.mission1 += 1;
  user.missions.mission2 += 1;
  user.missions.mission3 += 1;

  // Límites de seguridad
  if (user.missions.mission1 > 800)
    user.missions.mission1 = 800;

  if (user.missions.mission2 > 2000)
    user.missions.mission2 = 2000;

  if (user.missions.mission3 > 700)
    user.missions.mission3 = 700;

  await user.save();
}
    
    // 🎁 COMANDO RECLAMAR
if (message.content.trim().toLowerCase() === "<reclamar") {

  const id = message.author.id;

  let user = await User.findOne({ userId: id });

  if (!user) {
    return message.reply("❌ No tienes una racha registrada todavía.");
  }

  const member = message.member;
  const reclamadas = user.claimedRewards || [];
  let nuevasRecompensas = [];

  for (const dia in streakRewards) {

    const diaNumero = Number(dia);

    if (
      user.streakDays >= diaNumero &&
      !reclamadas.includes(diaNumero)
    ) {

      for (const roleId of streakRewards[dia]) {

        if (!member.roles.cache.has(roleId)) {
          await member.roles.add(roleId);
        }

        nuevasRecompensas.push(`<@&${roleId}>`);
      }

      user.claimedRewards.push(diaNumero);
    }
  }

  if (nuevasRecompensas.length === 0) {
    return message.reply("❌ No tienes recompensas nuevas para reclamar.");
  }

  await user.save();

  const embed = new EmbedBuilder()
    .setColor("#D8C28A")
    .setTitle("🔥 Recompensas reclamadas")
    .setDescription(
      nuevasRecompensas.map(r => `🎁 ${r}`).join("\n")
    )
    .setFooter({
      text: `Racha actual: ${user.streakDays} días`
    });

  return message.channel.send({
    embeds: [embed]
  });
}
    const canalesRacha = [
  "1498848652754419913",
  "1425641857173557249"
];

if (!canalesRacha.includes(message.channel.id)) return;

    // 📖 COMANDO DE RECOMPENSAS
    if (message.content.trim().toLowerCase() === "<recompensas") {

        let page = 0;

        const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId("reward_previous")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
        .setCustomId("reward_next")
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Secondary)
);
        const msg = await message.channel.send({
            embeds: [createRewardEmbed(page)],
            components: [row]
        });

        const collector = msg.createMessageComponentCollector({
            time: 300000
        });

        collector.on("collect", async (interaction) => {

            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    content: "❌ Solo quien ejecutó este comando puede usar los botones.",
                    ephemeral: true
                });
            }

            if (interaction.customId === "reward_previous") {
                page--;
                if (page < 0) page = 3;
            }

            if (interaction.customId === "reward_next") {
                page++;
                if (page > 3) page = 0;
            }

            await interaction.update({
                embeds: [createRewardEmbed(page)],
                components: [row]
            });

        });

        return;
    }

    const id = message.author.id;
    const ahora = Date.now();

    // Aquí continúa TODA tu lógica de rachas...
    
    // 24 horas expresadas en milisegundos (24 * 60 * 60 * 1000)
    const COOLDOWN_24_HORAS = 86400000; 

    let user = await User.findOne({ userId: id });

    if (!user) {
      await User.create({
        userId: id,
        streakDays: 1,
        lastAntiSpam: ahora,
        lastStreakUpdate: ahora
      });
      return;
    }

    if (ahora - user.lastAntiSpam < 3000) return;
    user.lastAntiSpam = ahora;

 // Si pasaron 24 horas o más desde la última subida, sumamos racha
if (ahora - user.lastStreakUpdate >= COOLDOWN_24_HORAS) {
  user.streakDays += 1;
  user.lastStreakUpdate = ahora;

  const canalAvisos = client.channels.cache.get("1498778534636818504");

  if (canalAvisos) {
    await canalAvisos.send(
      `🔥 <@${message.author.id}> ha aumentado su racha a **${user.streakDays} días**. ¡Felicidades! 🎉`
    );
  }
}

await user.save();

  } catch (err) {
    console.error("❌ MESSAGE ERROR:", err);
  }
});

// ⚡ INTERACTIONS
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  try {
    const cmd = i.commandName;

    // 📊 STATUS
    if (cmd === "status") {
      await i.deferReply({ ephemeral: true });
      const target = i.options.getUser("usuario") || i.user;
      const data = await User.findOne({ userId: target.id }).lean();

      if (!data) return i.editReply("❌ Sin datos");

      const ahora = Date.now();
      const COOLDOWN_24_HORAS = 86400000;
      const tiempoPasado = ahora - data.lastStreakUpdate;
      
      let indicadorSiguiente = "";
      if (tiempoPasado >= COOLDOWN_24_HORAS) {
        indicadorSiguiente = "🟢 ¡Escribe para subir tu racha!";
      } else {
        const horasRestantes = Math.ceil((COOLDOWN_24_HORAS - tiempoPasado) / (1000 * 60 * 60));
        indicadorSiguiente = `⏳ Podrás subir de racha en aprox. ${horasRestantes} horas.`;
      }

      return i.editReply(
        `📊 **Estado de ${target.username}**\n\n` +
        `🔥 Racha actual: **${data.streakDays} días**\n` +
        `${indicadorSiguiente}\n\n` +
        `⭐ *Nota: Tu racha es permanente y nunca bajará sola.*`
      );
    }

    // 🏆 TOP
    if (cmd === "top") {
      await i.deferReply({ ephemeral: true });
      const top = await User.find().sort({ streakDays: -1 }).limit(10).lean();

      if (!top.length) return i.editReply("❌ Sin datos aún");

      let text = "🏆 **TOP 10 DE RACHAS INMORTALES**\n\n";
      top.forEach((u, index) => {
        text += `**${index + 1}.** <@${u.userId}> — 🔥 Día ${u.streakDays}\n`;
      });

      return i.editReply(text);
    }

    // 🔥 SET STREAK
    if (cmd === "setstreak") {
      if (!i.memberPermissions?.has("Administrator")) {
        return i.reply({ content: "❌ Sin permisos", ephemeral: true });
      }

      const target = i.options.getUser("usuario");
      const dias = i.options.getInteger("dias");

      await User.updateOne(
        { userId: target.id },
        {
          $set: { 
            streakDays: dias,
            lastStreakUpdate: Date.now()
          },
          $setOnInsert: {
            userId: target.id,
            lastAntiSpam: 0
          }
        },
        { upsert: true }
      );

      return i.reply({
        content: `🔥 ${target.username} ahora tiene una racha de ${dias} días`,
        ephemeral: true
      });
    }

    // 🔥 ADD 1 DAY
    if (cmd === "add1day") {
      if (!i.memberPermissions?.has("Administrator")) {
        return i.reply({ content: "❌ Sin permisos", ephemeral: true });
      }

      await User.updateMany({}, { $inc: { streakDays: 1 } });
      return i.reply({
        content: "🔥 Se añadió 1 día a todos los usuarios de la base de datos",
        ephemeral: true
      });
    }

    // 🔥 ADD 10 DAYS
    if (cmd === "add10days") {
      if (!i.memberPermissions?.has("Administrator")) {
        return i.reply({ content: "❌ Sin permisos", ephemeral: true });
      }

      await User.updateMany({}, { $inc: { streakDays: 10 } });
      return i.reply({
        content: "🔥 Se añadieron 10 días a todos los usuarios de la base de datos",
        ephemeral: true
      });
    }

    // 🚨 RESET ALL
    if (cmd === "resetall") {
      if (!i.memberPermissions?.has("Administrator")) {
        return i.reply({ content: "❌ Sin permisos", ephemeral: true });
      }

      await User.updateMany({}, { 
        $set: { 
          streakDays: 0,
          lastStreakUpdate: 0 
        } 
      });

      return i.reply({
        content: "🚨 **Atención:** Se ha reiniciado la racha de todos los usuarios a **0 días**.",
        ephemeral: false
      });
    }

  } catch (err) {
    console.error("❌ INTERACTION ERROR:", err);
    if (!i.replied && !i.deferred) {
      await i.reply({ content: "❌ Error interno", ephemeral: true });
    } else if (i.deferred) {
      await i.editReply("❌ Error interno al procesar la acción");
    }
  }
});

client.login(process.env.TOKEN);
