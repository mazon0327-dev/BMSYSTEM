const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'help',
  description: 'Chat with Teacher Arlene',
  usage: 'help [message]',
  author: '0xcodex',

  async execute(senderId, args, token) {
    const prompt = args.join(' ').trim();

    // Check for owner questions
    const ownerKeywords = [
      'who is your owner',
      'who is your owner?',
      'who owns you',
      'who owns you?',
      'who created you',
      'who created you?',
      'who made you',
      'who made you?',
      'sino gumawa sayo',
      'sino gumawa sa iyo',
      'sino gumawa',
      'sino ang gumawa',
      'sino may ari sayo',
      'sino may ari sa iyo'
    ];

    // Check if user is asking about owner
    const isOwnerQuestion = ownerKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );

    if (isOwnerQuestion) {
      const ownerResponse = 'Wow! Nice question, well my boss created me, you can contact him now\nhttps://www.facebook.com/geotechph.net';
      await sendMessage(senderId, { text: ownerResponse }, token);
      return;
    }

    // Default response for "help" only
    if (!prompt || prompt.toLowerCase() === 'help') {
      const helpResponse = 'Hello! I\'m Teacher Arlene! Created by GeoDevz69. How can I assist you today?';
      await sendMessage(senderId, { text: helpResponse }, token);
      return;
    }

    // Process other queries with API
    try {
      const { data } = await axios.get(API_URL, {
        params: { 
          prompt: prompt,
          model: 'chatgpt4'
        },
        timeout: 15000
      });

      if (!data?.answer) {
        throw new Error('Invalid API response');
      }

      let aiResponse = data.answer.trim();
      
      // Convert **text** to Messenger bold format (*text*)
      aiResponse = aiResponse.replace(/\*\*(.+?)\*\*/g, '*$1*');
      aiResponse = aiResponse.replace(/\*/g, '');
      aiResponse = aiResponse.replace(/#{1,6}\s/g, '');
      aiResponse = aiResponse.replace(/---+/g, '');
      aiResponse = aiResponse.replace(/__/g, '');
      aiResponse = aiResponse.replace(/_/g, '');
      
      // Remove emojis
      aiResponse = aiResponse.replace(/[\u{1F000}-\u{1FFFF}]/gu, '');
      aiResponse = aiResponse.replace(/[\u{2600}-\u{27BF}]/gu, '');
      aiResponse = aiResponse.replace(/[\u{FE00}-\u{FEFF}]/gu, '');
      
      // Clean up
      aiResponse = aiResponse.replace(/\n{3,}/g, '\n\n');
      aiResponse = aiResponse.replace(/[ \t]+/g, ' ');
      aiResponse = aiResponse.trim();

      await sendChunks(senderId, aiResponse, token);

    } catch (error) {
      const reason = error.response
        ? `API error ${error.response.status}`
        : error.message ?? 'Unknown error';

      console.error(`[ai] Failed for sender ${senderId}: ${reason}`);
      await sendMessage(senderId, {
        text: 'Server error. Please try again later.'
      }, token);
    }
  }
};

const API_URL = 'https://yin-api.vercel.app/ai/chatgptfree';
const MAX_CHUNK = 1900;

function splitMessage(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += MAX_CHUNK) {
    chunks.push(text.slice(i, i + MAX_CHUNK));
  }
  return chunks;
}

async function sendChunks(senderId, text, token) {
  const chunks = splitMessage(text);
  for (let i = 0; i < chunks.length; i++) {
    await sendMessage(senderId, { text: chunks[i] }, token);
  }
}
