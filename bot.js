// 📦 Import wymaganych modułów i konfiguracji
const {
  Client, GatewayIntentBits, Partials,
  SlashCommandBuilder, Routes, REST,
  EmbedBuilder, PermissionsBitField,
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 📁 Śwcieżki do plików danych
const DATA_FILE = 'players.json';
const HISTORY_FILE = 'history.json';
const CONFIG_FILE = 'config.json';

// 🧠 Wczytanie danych
let players = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE)) : {};
let history = fs.existsSync(HISTORY_FILE) ? JSON.parse(fs.readFileSync(HISTORY_FILE)) : [];
let config = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE)) : { logChannelId: null };

// 🤖 Inicjalizacja klienta Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// 💾 Funkcja zapisu danych
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(players, null, 2));
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// 📜 Logowanie działań
function logAction(content, channel) {
  if (config.logChannelId) {
    const log = client.channels.cache.get(config.logChannelId);
    if (log) log.send(content);
  }
  console.log(`[LOG] ${content}`);
}

// 🚀 Gotowość bota
client.once('ready', () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
});

// 🎮 Obsługa komend i interakcji
client.on('interactionCreate', async interaction => {
  const { commandName, options, user, channel } = interaction;

  if (interaction.isChatInputCommand()) {
    logAction(`📥 Użyto komendy \`/${commandName}\` przez ${user.tag}`, channel);

    if (!players[user.id]) players[user.id] = { wins: 0, losses: 0, history: [] };

    // 🆘 Komenda: /help
    if (commandName === 'help') {
      const embed = new EmbedBuilder()
        .setTitle('🛠️ Pomoc - Komendy')
        .setColor(0x00AEFF)
        .setDescription('Lista dostępnych komend')
        .addFields(
          { name: '/statystyki [@uzytkownik]', value: '📊 Pokazuje statystyki gracza.' },
          { name: '/top', value: '🏅 Wyświetla TOP 10 graczy.' },
          { name: '/edytuj @uzytkownik <+/-/.> <+/-/.>', value: '✏️ Edytuje statystyki.' },
          { name: '/reset [@uzytkownik] [wszyscy]', value: '🧹 Resetuje statystyki jednego lub wszystkich graczy.' },
          { name: '/historia', value: '📜 Pokazuje ostatnie zmiany statystyk.' },
          { name: '/logchannel #kanał', value: '🔧 Ustawia kanał logów.' },
          { name: '/aktywnosc @uzytkownik', value: '📅 Pokazuje dni aktywności użytkownika.' },
          { name: '/regulamin', value: '📜 Pokazuje aktualny regulamin.' },
          { name: '/regulamin_zaktualizuj', value: '♻️ Aktualizuje wiadomość z regulaminem.' }
        )
        .setFooter({ text: 'Bot statystyk Discord | @nazizu' });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ✏️ Komenda: /edytuj
    if (commandName === 'edytuj') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
        return interaction.reply({ content: '❌ Brak uprawnień.', ephemeral: true });

      const target = options.getUser('uzytkownik');
      const winsOp = options.getString('wygrane');
      const lossesOp = options.getString('przegrane');

      if (!players[target.id]) players[target.id] = { wins: 0, losses: 0, history: [] };

      const winsDelta = winsOp === '+' ? 1 : winsOp === '-' ? -1 : 0;
      const lossesDelta = lossesOp === '+' ? 1 : lossesOp === '-' ? -1 : 0;

      players[target.id].wins += winsDelta;
      players[target.id].losses += lossesDelta;
      players[target.id].history.push(new Date().toISOString());

      history.push({ user: target.id, wins: winsDelta, losses: lossesDelta, editedBy: user.id, date: new Date() });
      saveData();

      logAction(`✏️ ${user.tag} zmodyfikował statystyki ${target.tag}: ${winsOp}W, ${lossesOp}P`, channel);
      return interaction.reply(`✅ Zmieniono statystyki <@${target.id}>: ${winsOp}W / ${lossesOp}P`);
    }

  if (commandName === 'reset') {
  const target = options.getUser('uzytkownik');
  const all = options.getBoolean('wszyscy');
  const type = options.getString('rodzaj') || 'wszystko';

  const resetStats = (id) => {
    if (!players[id]) return;
    if (type === 'wszystko') {
      players[id].wins = 0;
      players[id].losses = 0;
    } else if (type === 'wygrane') {
      players[id].wins = 0;
    } else if (type === 'przegrane') {
      players[id].losses = 0;
    }
    players[id].history = [];
  };

  if (all) {
    const confirm = new ModalBuilder()
      .setCustomId('confirm_reset_all')
      .setTitle('Potwierdź reset wszystkich')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('confirmation')
            .setLabel('Wpisz "RESETUJ" aby potwierdzić')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    return interaction.showModal(confirm);
  }

  if (target && players[target.id]) {
    resetStats(target.id);
    saveData();
    logAction(`🧹 ${user.tag} zresetował ${type} u ${target.tag}`, channel);
    return interaction.reply(`✅ Zresetowano **${type}** <@${target.id}>.`);
  }

  return interaction.reply({ content: '❌ Nie znaleziono użytkownika lub brak opcji.', ephemeral: true });
}
    // 🤖 Reset all potwierdzenie

    if (interaction.customId === 'confirm_reset_all') {
  const input = interaction.fields.getTextInputValue('confirmation');
  const type = 'wszystko'; // Można rozbudować modal o wybór typu resetu w przyszłości

  if (input === 'RESETUJ') {
    for (const id of Object.keys(players)) {
      if (type === 'wszystko') {
        players[id].wins = 0;
        players[id].losses = 0;
      } else if (type === 'wygrane') {
        players[id].wins = 0;
      } else if (type === 'przegrane') {
        players[id].losses = 0;
      }
      players[id].history = [];
    }

    saveData();
    logAction(`🧹 ${interaction.user.tag} zresetował WSZYSTKICH graczy!`, interaction.channel);
    return interaction.reply('✅ Zresetowano wszystkich graczy.');
  } else {
    return interaction.reply({ content: '❌ Anulowano reset. Niepoprawne potwierdzenie.', ephemeral: true });
  }
}


    // 📅 Komenda: /aktywnosc
    if (commandName === 'aktywnosc') {
      const target = options.getUser('uzytkownik');
      const userHistory = players[target.id]?.history || [];
      const days = userHistory.map(date => new Date(date).toLocaleDateString()).filter((v, i, a) => a.indexOf(v) === i);
      const embed = new EmbedBuilder()
        .setTitle(`📅 Aktywność - ${target.username}`)
        .setDescription(days.length ? days.map(d => `• ${d}`).join('\n') : 'Brak danych.')
        .setColor(0x33CC99)
        .setFooter({ text: 'Dni edycji statystyk' });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 📊 Komenda: /statystyki
    if (commandName === 'statystyki') {
      const target = options.getUser('uzytkownik') || user;
      const stats = players[target.id] || { wins: 0, losses: 0 };
      const embed = new EmbedBuilder()
        .setTitle(`📊 Statystyki - ${target.username}`)
        .setDescription(`🏆 Wygrane: ${stats.wins}\n💀 Przegrane: ${stats.losses}`)
        .setColor(0x0099ff);
      return interaction.reply({ embeds: [embed] });
    }

    // 🏅 Komenda: /top
    if (commandName === 'top') {
      const sorted = Object.entries(players)
        .map(([id, data]) => {
          const total = data.wins + data.losses;
          const winrate = total > 0 ? ((data.wins / total) * 100).toFixed(1) + '%' : '0%';
          return { id, wins: data.wins, losses: data.losses, winrate };
        })
        .sort((a, b) => (b.wins - a.wins) || (a.losses - b.losses))
        .slice(0, 10);

      const lines = await Promise.all(
        sorted.map(async (player, i) => {
          try {
            const member = await interaction.guild.members.fetch(player.id);
            const name = member.displayName || member.user.tag;
            return `\`${i + 1}.\` **${name}**\n 🏆 ${player.wins}W  ❌ ${player.losses}P  📈 ${player.winrate}`;
          } catch {
            return `\`${i + 1}.\` <@${player.id}>\n 🏆 ${player.wins}W  ❌ ${player.losses}P  📈 ${player.winrate}`;
          }
        })
      );

      const embed = new EmbedBuilder()
        .setTitle('🏅 Top 10 Graczy')
        .setDescription(lines.join('\n\n'))
        .setColor(0xFFD700)
        .setFooter({ text: 'Ranking według liczby wygranych' });

      return interaction.reply({ embeds: [embed] });
    }

    // 🕓 Komenda: /historia
    if (commandName === 'historia') {
      const lastChanges = history.slice(-10).map(entry =>
        `• <@${entry.user}>: ${entry.wins}W / ${entry.losses}P (przez <@${entry.editedBy}> — ${new Date(entry.date).toLocaleString()})`
      ).join('\n') || 'Brak historii.';
      const embed = new EmbedBuilder()
        .setTitle('📜 Ostatnie zmiany')
        .setDescription(lastChanges)
        .setColor(0x888888);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 📜 Komenda: /regulamin
    if (commandName === 'regulamin') {
      try {
        delete require.cache[require.resolve('./regulamin.json')];
        const data = require('./regulamin.json');

        const embed = new EmbedBuilder()
          .setTitle(data.title || '📜 Regulamin')
          .setDescription(data.description || '')
          .setColor(data.color || '#2ecc71');

        if (Array.isArray(data.fields)) {
          embed.addFields(...data.fields);
        }

        await interaction.reply({ embeds: [embed] });
      } catch (err) {
        console.error('Błąd przy wczytywaniu regulaminu:', err);
        await interaction.reply({
          content: '❌ Nie udało się wczytać regulaminu. Sprawdź plik `regulamin.json`.',
          ephemeral: true
        });
      }
    }

    // ♻️ Komenda: /regulamin_zaktualizuj
    if (commandName === 'regulamin_zaktualizuj') {
      try {
        delete require.cache[require.resolve('./regulamin.json')];
        const data = require('./regulamin.json');

        const embed = new EmbedBuilder()
          .setTitle(data.title || '📜 Regulamin')
          .setDescription(data.description || '')
          .setColor(data.color || '#2ecc71');

        if (Array.isArray(data.fields)) {
          embed.addFields(...data.fields);
        }

        const messages = await interaction.channel.messages.fetch({ limit: 20 });
        const previous = messages.find(msg =>
          msg.author.id === client.user.id &&
          msg.embeds.length > 0 &&
          msg.embeds[0].title === data.title
        );

        if (previous) {
          await previous.delete();
        }

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '✅ Regulamin został zaktualizowany!', ephemeral: true });
      } catch (err) {
        console.error('Błąd przy aktualizacji regulaminu:', err);
        await interaction.reply({ content: '❌ Nie udało się zaktualizować regulaminu.', ephemeral: true });
      }
    }
  }

  // 🧾 Obsługa modala resetu wszystkich
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'confirm_reset_all') {
      const input = interaction.fields.getTextInputValue('confirmation');
      if (input === 'RESETUJ') {
        players = {};
        saveData();
        logAction(`🧹 ${interaction.user.tag} zresetował WSZYSTKICH graczy!`, interaction.channel);
        return interaction.reply('✅ Zresetowano wszystkich graczy.');
      } else {
        return interaction.reply({ content: '❌ Anulowano reset. Niepoprawne potwierdzenie.', ephemeral: true });
      }
    }
  }
});

// 🔐 Logowanie klienta Discord
client.login(process.env.TOKEN);
