require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Wyświetla pomoc'),

  new SlashCommandBuilder()
    .setName('statystyki')
    .setDescription('Wyświetla statystyki użytkownika')
    .addUserOption(opt => 
      opt.setName('uzytkownik')
         .setDescription('Użytkownik')
         .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('top')
    .setDescription('Wyświetla top 10 graczy')
    .addStringOption(opt =>
      opt.setName('zakres')
         .setDescription('Zakres rankingu')
         .setRequired(true)
         .addChoices(
            { name: 'Tygodniowy', value: 'T' },
            { name: 'Miesięczny', value: 'M' },
            { name: 'Sezonowy', value: 'S' }
         )
    ),

  new SlashCommandBuilder()
    .setName('edytuj')
    .setDescription('Edytuj statystyki')
    .addUserOption(opt =>
      opt.setName('uzytkownik')
         .setDescription('Użytkownik')
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('wygrane')
         .setDescription('+ / - / .')
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('przegrane')
         .setDescription('+ / - / .')
         .setRequired(true)
    ),

new SlashCommandBuilder()
  .setName('reset')
  .setDescription('Resetuje statystyki użytkownika lub wszystkich')
  .addUserOption(opt => 
    opt.setName('uzytkownik')
      .setDescription('Użytkownik do zresetowania')
  )
  .addBooleanOption(opt => 
    opt.setName('wszyscy')
      .setDescription('Resetuje statystyki wszystkich')
  )
  .addStringOption(opt =>
    opt.setName('rodzaj')
      .setDescription('Rodzaj resetu')
      .addChoices(
        { name: 'Wszystko', value: 'wszystko' },
        { name: 'Wygrane', value: 'wygrane' },
        { name: 'Przegrane', value: 'przegrane' }
      )
  ),


  new SlashCommandBuilder()
    .setName('historia')
    .setDescription('Wyświetla historię zmian'),

  new SlashCommandBuilder()
    .setName('logchannel')
    .setDescription('Ustaw kanał logów')
    .addChannelOption(opt =>
      opt.setName('kanał')
         .setDescription('Kanał do logów')
         .setRequired(true)
    ),

    new SlashCommandBuilder()
  .setName('regulamin')
  .setDescription('Wyświetla regulamin serwera'),

new SlashCommandBuilder()
  .setName('regulamin_zaktualizuj')
  .setDescription('Aktualizuje wiadomość z regulaminem na tym kanale (odczytuje z regulamin.json)'),


  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Pokazuje aktywność użytkownika')
    .addUserOption(opt =>
      opt.setName('uzytkownik')
         .setDescription('Użytkownik')
         .setRequired(true)
    ),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔁 Rejestruję komendy globalnie...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, '1387163228655587328'),
      { body: commands }
    );
    console.log('✅ Komendy zarejestrowane!');
  } catch (error) {
    console.error(error);
  }
})();
