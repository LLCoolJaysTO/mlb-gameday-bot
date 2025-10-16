// --- Core setup ---
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const gameday = require('./modules/gameday');
const globalCache = require('./modules/global-cache');
const queries = require('./database/queries');
const mlbAPIUtil = require('./modules/MLB-API-util'); // ✅ Added for MLB data access
const { LOG_LEVEL } = require('./config/globals');
const LOGGER = require('./modules/logger')(process.env.LOG_LEVEL?.trim() || LOG_LEVEL.INFO);

// --- Discord client setup ---
const BOT = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// --- Load command files ---
BOT.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    BOT.commands.set(command.data.name, command);
}

// --- Function to refresh current games ---
async function refreshNearestGames() {
    try {
        const games = await mlbAPIUtil.currentGames();
        globalCache.values.nearestGames = games;
        LOGGER.info(`✅ Cached ${games.length} current games from MLB API.`);
        if (games.length > 0) {
            LOGGER.info('First game found: ' + games[0].teams.away.team.name + ' vs ' + games[0].teams.home.team.name);
        } else {
            LOGGER.warn('⚠️ No games found within the past 24h or next 24h window.');
        }
    } catch (err) {
        LOGGER.error('❌ Failed to refresh current games:', err);
        globalCache.values.nearestGames = [];
    }
}

// --- When the bot starts ---
BOT.once('ready', async () => {
    LOGGER.info('Ready!');

    try {
        const emojis = await BOT.application.emojis.fetch();
        LOGGER.info('Fetched application emojis.');
        globalCache.values.emojis = Array.from(emojis.values());
    } catch (e) {
        console.error(e);
        globalCache.values.emojis = [];
    }

    // Load subscribed channels (if database is working)
    try {
        globalCache.values.subscribedChannels = await queries.getAllSubscribedChannels();
        LOGGER.info('Subscribed channels: ' + JSON.stringify(globalCache.values.subscribedChannels, null, 2));
    } catch {
        LOGGER.warn('⚠️ Database connection skipped. Using dummy pool.');
        globalCache.values.subscribedChannels = [];
    }

    // ✅ Initial fetch
    await refreshNearestGames();

    // 🔁 Auto-refresh every 5 minutes (300000 ms)
    setInterval(refreshNearestGames, 300000);

    await gameday.statusPoll(BOT);
});

// --- Bot login ---
BOT.login(process.env.TOKEN?.trim()).then(() => {
    LOGGER.info('bot successfully logged in');
});

// --- Handle slash commands ---
BOT.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = BOT.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, BOT.guilds);
    } catch (error) {
        LOGGER.error(error);
        if (interaction.deferred) {
            await interaction.followUp({ content: 'error', ephemeral: true });
        } else if (!interaction.replied) {
            await interaction.reply({ content: 'error', ephemeral: true });
        }
    }
});

// --- Keep Render alive (for free hosting) ---
const express = require("express");
const app = express();

// Small “webpage” so Render detects an open port
app.get("/", (req, res) => res.send("MLB Gameday Bot is running!"));
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
