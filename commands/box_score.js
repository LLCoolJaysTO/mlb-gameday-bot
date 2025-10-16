const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('box_score')
    .setDescription('View the current game\'s box score.'),
  async execute(interaction) {
    try {
      // Do NOT call deferReply here — it's already done inside boxScoreHandler
      await interactionHandlers.boxScoreHandler(interaction);
    } catch (e) {
      console.error(e);

      // Handle errors gracefully so the bot doesn't crash
      if (interaction.deferred && !interaction.replied) {
        await interaction.followUp({
          content: 'There was an error processing this command. If it persists, please reach out to the developer.',
          ephemeral: true
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          content: 'There was an error processing this command. If it persists, please reach out to the developer.',
          ephemeral: true
        });
      }
    }
  }
};
