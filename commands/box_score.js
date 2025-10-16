const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('box_score')
    .setDescription('View the current game\'s box score.'),
  async execute(interaction) {
    try {
      // 👇 Add this line
      await interaction.deferReply();

      await interactionHandlers.boxScoreHandler(interaction);
    } catch (e) {
      console.error(e);
      if (interaction.deferred && !interaction.replied) {
        await interaction.followUp('There was an error processing this command. If it persists, please reach out to the developer.');
      } else if (!interaction.replied) {
        await interaction.reply('There was an error processing this command. If it persists, please reach out to the developer.');
      }
    }
  }
};
