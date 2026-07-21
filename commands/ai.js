const axios = require('axios');

module.exports = {
  config: { 
    name: 'ai', 
    aliases: ['gpt', 'ask', 'chatgpt'], 
    description: 'Ask AI anything (Free Multi-AI Failover)', 
    usage: 'ai <question>', 
    cooldown: 5, 
    role: 0, 
    category: 'ai' 
  },
  async run({ api, event, args, message, logger }) {
    try {
      if (args.length === 0) return api.sendMessage('❌ Usage: ai <question>\nExample: ai What is JavaScript?', event.threadId);
      const question = args.join(' ');

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const endpoints = [
        `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(question)}&botname=AI&ownername=Jisan`,
        `https://kaiz-apis.gleeze.com/api/gemini-pro?ask=${encodeURIComponent(question)}`,
        `https://simsimi.cyberbot.top/simsimi?text=${encodeURIComponent(question)}`
      ];

      // If OPENAI_API_KEY is present, put OpenAI as top priority
      if (process.env.OPENAI_API_KEY) {
        try {
          const res = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: 'You are a helpful assistant. Keep responses concise.' }, { role: 'user', content: question }],
            max_tokens: 500, temperature: 0.7
          }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 15000 });
          api.setMessageReaction("✅", event.messageID, () => {}, true);
          return api.sendMessage(`🤖 AI Response:\n\n${res.data.choices[0].message.content}`, event.threadId);
        } catch (_) {}
      }

function isValidAiResponse(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('<') || trimmed.endsWith('>') || trimmed.startsWith('{') || trimmed.startsWith('<!')) return false;
  if (/<[a-z0-9]+[\s\S]*?>/i.test(trimmed)) return false;
  if (/<!DOCTYPE|<html|<head|<body|<script|fingerprint|simsimi\.net|redirect_link|rdrTimeout|visitorId|cloudflare|just a moment|tr_uuid/i.test(trimmed)) return false;
  if (trimmed.includes('simsimi.net')) return false;
  return true;
}

      for (const ep of endpoints) {
        try {
          const res = await axios.get(ep, { timeout: 12000, headers: { 'Accept': 'application/json' } });
          const answer = res.data?.response || res.data?.reply || res.data?.message || (typeof res.data === 'string' ? res.data : null);
          let finalAns = Array.isArray(answer) ? answer[0] : answer;
          if (isValidAiResponse(finalAns)) {
            api.setMessageReaction("✅", event.messageID, () => {}, true);
            return api.sendMessage(`🤖 AI Response:\n\n${finalAns.trim()}`, event.threadId);
          }
        } catch (_) {}
      }

      // Final fallback via Pollinations AI Text
      const pollRes = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(question)}`, { timeout: 12000 });
      const pollText = typeof pollRes.data === 'string' ? pollRes.data : null;
      if (isValidAiResponse(pollText)) {
        api.setMessageReaction("✅", event.messageID, () => {}, true);
        return api.sendMessage(`🤖 AI Response:\n\n${pollText.trim()}`, event.threadId);
      }

      throw new Error('All AI services are busy');
    } catch (e) {
      logger.error('Error in ai command', { error: e.message });
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage(`❌ Could not reach AI service right now. Please try again later.`, event.threadId);
    }
  }
};
