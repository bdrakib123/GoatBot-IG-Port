const axios = require('axios');

module.exports = {
  config: {
    name: 'gpt',
    aliases: ['ai', 'ask'],
    description: 'Chat with AI powered by GPT-4',
    usage: 'gpt <message>',
    role: 0,
    cooldown: 5,
    category: 'ai'
  },

  async onStart({ api, event, args, message }) {
    const prompt = args.join(' ');
    if (!prompt) return message.reply('Please provide a prompt.');

    try {
      const response = await axios.get(`https://api.jisan-official.com/gpt4?prompt=${encodeURIComponent(prompt)}`);
      const rawAns = response.data?.response || response.data?.answer || (typeof response.data === 'string' ? response.data : null);

      if (rawAns && typeof rawAns === 'string') {
        const cleaned = rawAns.trim();
        if (!cleaned.startsWith('<') && !/<!DOCTYPE|<html|<head|<script|cloudflare|just a moment|fingerprint/i.test(cleaned)) {
          message.reply(cleaned);
          message.reaction('✅');
          return;
        }
      }
      message.reply('⚠️ Received invalid response from AI service.');
      message.reaction('⚠️');
    } catch (error) {
      console.error('GPT Error:', error.message);
      message.reply('An error occurred while connecting to AI service.');
    }
  }
};
